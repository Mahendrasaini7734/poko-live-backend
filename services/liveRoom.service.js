/**
 * LIVE ROOM service - the single place for everything that happens INSIDE a running live:
 *
 *   join / leave / disconnect   -> participants + viewer count   (always consistent, self healing)
 *   chat                        -> validated, de-duplicated, acknowledged, replayed on reconnect
 *   gifts                       -> idempotent + transactional (coins can never be lost / charged twice)
 *   liveSync                    -> one call that (re)builds the whole client state
 *
 * Session lifecycle (start / end / heartbeat / reaper) stays in liveSession.service.js.
 *
 * Socket events (server -> app)
 *   liveJoinerCount        number                       viewer count (legacy + new)
 *   liveParticipantJoined  { user, totalViews }         host sees WHO joined
 *   liveParticipantLeft    { userId, totalViews }
 *   liveParticipantsList   { participants, totalViews, hasMore } answer to liveParticipantsRequest
 *   liveCommentBroadcast   JSON string                  chat (messageId + clientMsgId for de-dup)
 *   liveCommentHistory     [ ...messages ]              last messages, sent on join / reconnect
 *   liveGiftReceived       gift payload (giftRequestId) room + host, exactly once per socket
 *   liveGiftError          { giftRequestId, error }     sender only
 *   liveEarningsUpdate     { liveHistoryId, sessionCoins, hostCoin }   host only
 *   liveStreamEnd          JSON string                  live ended (all reasons)
 *   liveJoinRejected       { liveHistoryId, reason }    joined an ended / unknown live
 */
const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("../models/user.model");
const Host = require("../models/host.model");
const Agency = require("../models/agency.model");
const Gift = require("../models/gift.model");
const History = require("../models/history.model");
const LiveBroadcaster = require("../models/liveBroadcaster.model");
const LiveBroadcastView = require("../models/liveBroadcastView.model");
const LiveBroadcastHistory = require("../models/liveBroadcastHistory.model");
const LiveComment = require("../models/liveComment.model");
const generateHistoryUniqueId = require("../util/generateHistoryUniqueId");
const { getDisplayName } = require("../util/hostDisplay");

const isId = (v) => !!v && mongoose.Types.ObjectId.isValid(String(v));
const str = (v) => (v === undefined || v === null ? "" : String(v));
const log = (tag, data) => console.log(`[${tag}]`, JSON.stringify(data));

const getAnalytics = () => {
  try {
    return require("./liveAnalytics.service");
  } catch (_) {
    return null;
  }
};

// an open session has endTime "" / null / missing
const isOpen = (history) => !history.endTime || history.endTime === "";

// ---------------------------------------------------------------------------
// Active live lookup
// ---------------------------------------------------------------------------
/** @returns {Promise<{broadcaster:object, history:object}|null>} null when the live is over / unknown */
const getActiveLive = async (liveHistoryId) => {
  if (!isId(liveHistoryId)) return null;
  const [broadcaster, history] = await Promise.all([
    LiveBroadcaster.findOne({ liveHistoryId }).select("_id hostId liveHistoryId name image channel agoraUid view").lean(),
    LiveBroadcastHistory.findById(liveHistoryId).select("_id hostId endTime").lean(),
  ]);
  if (!broadcaster || !history || !isOpen(history)) return null;
  return { broadcaster, history };
};

// ---------------------------------------------------------------------------
// Chat buffers (replayed to anybody who joins / reconnects)
// ---------------------------------------------------------------------------
const MAX_HISTORY = 40;
const roomComments = new Map(); // roomId -> messages[]

const pushComment = (roomId, message) => {
  const list = roomComments.get(roomId) || [];
  list.push(message);
  if (list.length > MAX_HISTORY) list.splice(0, list.length - MAX_HISTORY);
  roomComments.set(roomId, list);
};
const getRecentComments = (roomId) => (roomComments.get(String(roomId)) || []).slice();

/**
 * Last messages of a live for a joining / reconnecting client. The in-memory buffer (includes system
 * lines) is merged with the persisted comments, so after a server restart (or on another instance) a
 * viewer that joins late still sees the recent chat. Oldest first, same shape as the realtime message,
 * de-duplicated by messageId.
 */
const loadRecentComments = async (roomId) => {
  const buffered = getRecentComments(roomId);
  if (buffered.length >= MAX_HISTORY || !isId(roomId)) return buffered;
  try {
    const rows = await LiveComment.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY)
      .select("feedId userId name image text isHostMessage createdAt")
      .lean();
    const known = new Set(buffered.map((m) => str(m.messageId)));
    const stored = rows
      .filter((r) => !known.has(str(r.feedId)))
      .map((r) => ({
        messageId: str(r.feedId),
        liveHistoryId: String(roomId),
        userId: str(r.userId),
        userName: r.name || "",
        displayName: r.name || "",
        userImage: r.image || "",
        commentText: r.text || "",
        isHostMessage: r.isHostMessage === true,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    if (stored.length === 0) return buffered;
    return [...stored, ...buffered]
      .sort((x, y) => Date.parse(x.createdAt) - Date.parse(y.createdAt))
      .slice(-MAX_HISTORY);
  } catch (err) {
    console.error("[LIVE_CHAT] history load failed:", err.message);
    return buffered;
  }
};
const clearRoomState = (roomId) => {
  roomComments.delete(String(roomId));
};

// ---------------------------------------------------------------------------
// Delivery helper: the HOST must always receive live events (chat, audience changes), even if his
// socket is not (yet / any more) in the live room (reconnect, join race). `except(room)` guarantees
// ONE delivery per socket. Clients de-duplicate by messageId / userId anyway.
// ---------------------------------------------------------------------------
const emitToLive = (io, roomId, hostId, event, payload) => {
  io.in(String(roomId)).emit(event, payload);
  if (hostId) {
    io.in(`globalRoom:${hostId}`).except(String(roomId)).emit(event, payload);
  }
};

// ---------------------------------------------------------------------------
// Viewers / participants
// ---------------------------------------------------------------------------
const imageOf = (v) => (v && typeof v === "object" ? v.url || "" : str(v));

const viewerDTO = (v) => ({
  userId: str(v.userId),
  name: getDisplayName(v.name, v.userId),
  image: imageOf(v.image),
  gender: str(v.gender),
  country: str(v.country),
  countryFlagImage: str(v.countryFlagImage),
  joinedAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
});

const MAX_AUDIENCE_PAGE = 500;

const listParticipants = async (liveHistoryId, limit = 200, skip = 0) => {
  const rows = await LiveBroadcastView.find({ liveHistoryId })
    .sort({ createdAt: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .select("userId name image gender country countryFlagImage createdAt")
    .lean();
  return rows.map(viewerDTO);
};

/**
 * Authoritative audience of a live (database): one page of viewers + the TRUE total.
 * The total is a count, never "length of the page" (a live with 800 viewers reports 800, not 200).
 */
const getAudience = async (liveHistoryId, { limit, skip } = {}) => {
  const lim = Math.min(Math.max(parseInt(limit, 10) || 200, 1), MAX_AUDIENCE_PAGE);
  const off = Math.max(parseInt(skip, 10) || 0, 0);
  const [participants, totalViews] = await Promise.all([
    listParticipants(liveHistoryId, lim, off),
    LiveBroadcastView.countDocuments({ liveHistoryId }),
  ]);
  return { participants, totalViews, hasMore: off + participants.length < totalViews, skip: off, limit: lim };
};

/**
 * Removes viewers whose socket is gone (crash, lost internet, server restart ...) and returns the
 * TRUE viewer count. Called on every join / leave and by the periodic sweep, so the count heals itself.
 */
const reconcileViewers = async (io, roomId, hostId = null) => {
  try {
    const sockets = await io.in(String(roomId)).fetchSockets();
    const alive = sockets.map((s) => s.id);
    const cutoff = new Date(Date.now() - 15 * 1000); // grace for a join that is still being written

    const stale = await LiveBroadcastView.find({
      liveHistoryId: roomId,
      socketId: { $nin: alive },
      updatedAt: { $lt: cutoff },
    })
      .select("_id userId")
      .lean();

    if (stale.length) {
      await LiveBroadcastView.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
      const total = await LiveBroadcastView.countDocuments({ liveHistoryId: roomId });
      stale.forEach((s) =>
        emitToLive(io, roomId, hostId, "liveParticipantLeft", { liveHistoryId: String(roomId), userId: str(s.userId), totalViews: total })
      );
      emitToLive(io, roomId, hostId, "liveJoinerCount", total);
      log("LIVE_VIEWERS", { roomId: String(roomId), pruned: stale.length, totalViews: total });
    }
  } catch (err) {
    console.error("[LIVE_VIEWERS] reconcile failed:", err.message);
  }
  return LiveBroadcastView.countDocuments({ liveHistoryId: roomId });
};

/** persists the count in the 3 places the app / admin read it from */
const persistViewCount = async (broadcaster, roomId, totalViews) => {
  try {
    await Promise.all([
      LiveBroadcaster.updateOne({ _id: broadcaster._id }, { $set: { view: totalViews } }),
      LiveBroadcastHistory.updateOne(
        { _id: roomId },
        { $max: { audienceCount: totalViews } } // history keeps the PEAK audience
      ),
      Host.updateOne({ _id: broadcaster.hostId }, { $set: { view: totalViews } }),
    ]);
  } catch (err) {
    console.error("[LIVE_VIEWERS] persist failed:", err.message);
  }
};

const hostStatusTimers = new Map();
/** debounced: 50 viewers joining in a second produce ONE hostStatusUpdate (discover lists / view count) */
const announceHostStatus = (hostId, delayMs = 400) => {
  const key = String(hostId);
  if (hostStatusTimers.has(key)) return;
  const t = setTimeout(() => {
    hostStatusTimers.delete(key);
    try {
      if (typeof global.emitHostStatusUpdate === "function") global.emitHostStatusUpdate(key);
    } catch (_) {
      /* best effort */
    }
  }, delayMs);
  if (t.unref) t.unref();
  hostStatusTimers.set(key, t);
};

const rejectJoin = (io, socket, liveHistoryId, reason = "LIVE_ENDED") => {
  socket.emit("liveJoinRejected", { liveHistoryId: str(liveHistoryId), reason });
  socket.emit("liveStreamEnd", JSON.stringify({ liveHistoryId: str(liveHistoryId), reason: "ended" }));
};

/**
 * A viewer enters a live. Idempotent: calling it again (reconnect, app resume) only refreshes the
 * socket. Never joins a live that is over.
 * @returns {{ok:boolean, reason?:string, isNew?:boolean, totalViews?:number, active?:object}}
 */
const joinViewer = async ({ io, socket, userId, liveHistoryId }) => {
  const active = await getActiveLive(liveHistoryId);
  if (!active) {
    rejectJoin(io, socket, liveHistoryId);
    return { ok: false, reason: "LIVE_ENDED" };
  }
  if (!isId(userId)) return { ok: false, reason: "INVALID_USER" };

  const user = await User.findById(userId).select("_id name image gender country countryFlagImage").lean();
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

  const roomId = String(liveHistoryId);
  socket.join(roomId);
  socket.data.liveHistoryId = roomId;

  const existing = await LiveBroadcastView.findOne({ userId: user._id, liveHistoryId }).select("_id socketId").lean();
  const fields = {
    name: user.name || "",
    image: imageOf(user.image),
    gender: user.gender || "",
    country: user.country || "",
    countryFlagImage: user.countryFlagImage || "",
    socketId: socket.id,
    lastSeenAt: new Date(),
  };

  let view;
  try {
    view = await LiveBroadcastView.findOneAndUpdate(
      { userId: user._id, liveHistoryId },
      { $set: fields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (err) {
    if (err && err.code === 11000) {
      // two joins raced: the other one created the row -> just attach this socket
      view = await LiveBroadcastView.findOneAndUpdate({ userId: user._id, liveHistoryId }, { $set: fields }, { new: true }).lean();
    } else {
      throw err;
    }
  }

  // the host may have ended the live while this join was being written: never leave a viewer row
  // behind in a dead live (nobody would clean it up)
  if (!(await getActiveLive(liveHistoryId))) {
    await LiveBroadcastView.deleteOne({ userId: user._id, liveHistoryId, socketId: socket.id }).catch(() => {});
    socket.leave(roomId);
    rejectJoin(io, socket, liveHistoryId);
    return { ok: false, reason: "LIVE_ENDED" };
  }

  const isNew = !existing;
  const hostId = active.broadcaster.hostId;
  const totalViews = await reconcileViewers(io, roomId, hostId);

  emitToLive(io, roomId, hostId, "liveJoinerCount", totalViews);
  if (isNew) {
    emitToLive(io, roomId, hostId, "liveParticipantJoined", { liveHistoryId: roomId, user: viewerDTO(view), totalViews });
  }

  await persistViewCount(active.broadcaster, roomId, totalViews);
  announceHostStatus(active.broadcaster.hostId);

  log("LIVE_JOIN", { roomId, userId: str(user._id), isNew, totalViews });
  return { ok: true, isNew, totalViews, active, user };
};

/**
 * A viewer leaves. `socketId` set  => only removes the row if THAT socket still owns it
 * (disconnect of an old socket must not kick a user that already re-joined on a new one).
 */
const leaveViewer = async ({ io, userId, liveHistoryId, socketId = null }) => {
  if (!isId(userId) || !isId(liveHistoryId)) return { removed: false };
  const roomId = String(liveHistoryId);

  const filter = { userId, liveHistoryId };
  if (socketId) filter.socketId = socketId;

  const view = await LiveBroadcastView.findOneAndDelete(filter).lean();
  if (!view) return { removed: false };

  const broadcaster = await LiveBroadcaster.findOne({ liveHistoryId }).select("_id hostId").lean();
  const hostId = broadcaster ? broadcaster.hostId : null;
  const totalViews = await reconcileViewers(io, roomId, hostId);

  emitToLive(io, roomId, hostId, "liveJoinerCount", totalViews);
  emitToLive(io, roomId, hostId, "liveParticipantLeft", { liveHistoryId: roomId, userId: str(userId), totalViews });
  // legacy event (older app builds)
  emitToLive(io, roomId, hostId, "removeLiveJoiner", {
    userId: str(userId),
    liveHistoryId: roomId,
    name: getDisplayName(view.name, userId),
    totalViews,
  });

  if (broadcaster) {
    await persistViewCount(broadcaster, roomId, totalViews);
    announceHostStatus(broadcaster.hostId);
  }

  log("LIVE_LEAVE", { roomId, userId: str(userId), totalViews });
  return { removed: true, totalViews };
};

/** socket disconnected: every viewer row owned by this socket goes away */
const handleSocketDisconnect = async (io, socket) => {
  try {
    const rows = await LiveBroadcastView.find({ socketId: socket.id }).select("userId liveHistoryId").lean();
    for (const row of rows) {
      // one viewer = one row (counting rule). If the SAME user is still connected to this live from
      // another socket / device, that socket takes the row over instead of the viewer disappearing.
      const siblings = (await io.in(String(row.liveHistoryId)).fetchSockets()).filter(
        (s) => s.id !== socket.id && String(s.data?.userId || "") === String(row.userId)
      );
      if (siblings.length > 0) {
        await LiveBroadcastView.updateOne(
          { userId: row.userId, liveHistoryId: row.liveHistoryId, socketId: socket.id },
          { $set: { socketId: siblings[0].id, lastSeenAt: new Date() } }
        );
        continue;
      }
      await leaveViewer({ io, userId: row.userId, liveHistoryId: row.liveHistoryId, socketId: socket.id });
    }
  } catch (err) {
    console.error("[LIVE_VIEWERS] disconnect cleanup failed:", err.message);
  }
};

/** periodic self healing for all running lives (also covers a server restart) */
let sweepTimer = null;
const startViewerSweep = (io, everyMs = 60 * 1000) => {
  if (sweepTimer) return;
  sweepTimer = setInterval(async () => {
    try {
      const live = await LiveBroadcaster.find({}).select("_id hostId liveHistoryId").lean();
      for (const b of live) {
        const roomId = String(b.liveHistoryId);
        const total = await reconcileViewers(io, roomId, b.hostId);
        await persistViewCount(b, roomId, total);
      }
    } catch (err) {
      console.error("[LIVE_VIEWERS] sweep failed:", err.message);
    }
  }, everyMs);
  if (sweepTimer.unref) sweepTimer.unref();
};

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
const seenMessages = new Map(); // `${room}:${sender}:${clientMsgId}` -> { messageId, at }
const SEEN_TTL_MS = 5 * 60 * 1000;

const rememberMessage = (key, messageId) => {
  seenMessages.set(key, { messageId, at: Date.now() });
  if (seenMessages.size > 5000) {
    const now = Date.now();
    for (const [k, v] of seenMessages) if (now - v.at > SEEN_TTL_MS) seenMessages.delete(k);
  }
};

const RATE_WINDOW_MS = 3000;
const RATE_MAX = 6;
const rateLimited = (socket) => {
  const now = Date.now();
  const list = (socket.data._commentTimes || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    socket.data._commentTimes = list;
    return true;
  }
  list.push(now);
  socket.data._commentTimes = list;
  return false;
};

/**
 * Chat message from the host OR a viewer. The sender gets the broadcast too (single source of truth),
 * a retry with the same clientMsgId is ignored, and the sender always gets an ack (ok / error).
 * @returns {{ok:boolean, messageId?:string, duplicate?:boolean, error?:string}}
 */
const sendComment = async ({ io, socket, data }) => {
  const payload = typeof data === "string" ? JSON.parse(data) : data || {};

  const text = str(payload.commentText ?? payload.comment ?? payload.message ?? payload.text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
  if (!text) return { ok: false, error: "EMPTY_MESSAGE" };

  const analytics = getAnalytics();
  let roomId = payload.liveHistoryId;
  if (analytics && analytics.resolveRoomId) {
    roomId =
      (await analytics.resolveRoomId({
        liveHistoryId: payload.liveHistoryId,
        hostId: payload.hostId,
        userId: payload.userId,
        socket,
        trust: "payload",
      })) || roomId;
  }
  if (!isId(roomId)) return { ok: false, error: "LIVE_NOT_FOUND" };
  roomId = String(roomId);

  const active = await getActiveLive(roomId);
  if (!active) {
    rejectJoin(io, socket, roomId);
    return { ok: false, error: "LIVE_ENDED" };
  }

  const senderId = str(payload.userId || payload.hostId || socket.data?.userId);
  const clientMsgId = str(payload.clientMsgId);

  if (clientMsgId) {
    const key = `${roomId}:${senderId}:${clientMsgId}`;
    const seen = seenMessages.get(key);
    if (seen) return { ok: true, duplicate: true, messageId: seen.messageId };
  }

  if (rateLimited(socket)) return { ok: false, error: "RATE_LIMITED" };

  if (!socket.rooms.has(roomId)) socket.join(roomId);
  socket.data.liveHistoryId = roomId;

  const displayName = getDisplayName(payload.userName, senderId || "user");
  const messageId = new mongoose.Types.ObjectId().toString();
  const isHostSender = Boolean(socket.data?.isHost) && str(socket.data?.hostId) === str(active.broadcaster.hostId);

  const message = {
    ...payload,
    liveHistoryId: roomId,
    messageId,
    clientMsgId,
    userId: senderId,
    userName: displayName,
    displayName,
    userImage: str(payload.userImage),
    commentText: text,
    isHostMessage: isHostSender,
    createdAt: new Date().toISOString(),
  };
  delete message.comment;
  delete message.message;
  delete message.text;

  if (clientMsgId) rememberMessage(`${roomId}:${senderId}:${clientMsgId}`, messageId);

  emitToLive(io, roomId, active.broadcaster.hostId, "liveCommentBroadcast", JSON.stringify(message));
  pushComment(roomId, message);

  if (analytics && analytics.notifyComment) {
    // same id as the realtime message -> the persisted row IS the message (history / admin never duplicate it)
    analytics.notifyComment({
      feedId: messageId,
      isHostMessage: isHostSender,
      liveHistoryId: roomId,
      userId: senderId || null,
      userName: displayName,
      userImage: message.userImage,
      commentText: text,
      isSystemMessage: payload.isSystemMessage === true,
    });
  }

  LiveBroadcastHistory.updateOne({ _id: roomId }, { $inc: { liveComments: 1 } }).catch(() => {});

  return { ok: true, messageId };
};

/** system line ("joined", "host joined") - goes into the replay buffer, never counted as a user comment */
const systemMessage = (io, roomId, message, hostId = null) => {
  const full = {
    ...message,
    messageId: message.messageId || new mongoose.Types.ObjectId().toString(),
    liveHistoryId: String(roomId),
    isSystemMessage: true,
    createdAt: new Date().toISOString(),
  };
  emitToLive(io, roomId, hostId, "liveCommentBroadcast", JSON.stringify(full));
  pushComment(String(roomId), full);
};

// ---------------------------------------------------------------------------
// Gifts
// ---------------------------------------------------------------------------
const processedGifts = new Map(); // `${sender}:${requestId}` -> { at, result }
const GIFT_TTL_MS = 10 * 60 * 1000;

const isTransactionUnsupported = (err) =>
  /Transaction numbers are only allowed|replica set|does not support transactions|not supported/i.test(String((err && err.message) || ""));

class GiftError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

const money = (n) => Number(Number(n).toFixed(2));

/** all the writes of ONE gift inside a transaction (atomic) */
const giftWithTransaction = async (plan) => {
  const session = await mongoose.startSession();
  let history = null;
  try {
    await session.withTransaction(async () => {
      history = null;
      const debit = await User.updateOne(
        { _id: plan.sender._id, coin: { $gte: plan.totalCoin } },
        { $inc: { coin: -plan.totalCoin, spentCoins: plan.totalCoin } },
        { session }
      );
      if (debit.modifiedCount !== 1) throw new GiftError("INSUFFICIENT_COINS", "You don't have enough coins.");

      const credit = await Host.updateOne(
        { _id: plan.receiver._id },
        { $inc: { coin: plan.hostEarnings, totalGifts: plan.count } },
        { session }
      );
      if (credit.modifiedCount !== 1) throw new GiftError("HOST_NOT_FOUND", "Receiver host not found.");

      if (plan.agency && plan.agencyShare > 0) {
        const agencyTotal = money(plan.hostEarnings + plan.agencyShare);
        await Agency.updateOne(
          { _id: plan.agency._id },
          {
            $inc: {
              hostCoins: plan.hostEarnings,
              totalEarnings: plan.agencyShare,
              netAvailableEarnings: agencyTotal,
              totalEarningsWithCommissionAndHostCoin: agencyTotal,
            },
          },
          { session }
        );
      }

      if (plan.roomId) {
        await LiveBroadcastHistory.updateOne({ _id: plan.roomId }, { $inc: { coins: plan.totalCoin, gifts: plan.count } }, { session });
      }

      [history] = await History.create([plan.historyDoc], { session });
    });
  } finally {
    await session.endSession();
  }
  return history;
};

/** standalone Mongo (no replica set): unique History row claims the request first, then compensate on failure */
const giftWithoutTransaction = async (plan) => {
  const history = await History.create(plan.historyDoc); // E11000 => this giftRequestId was already charged

  const debit = await User.updateOne(
    { _id: plan.sender._id, coin: { $gte: plan.totalCoin } },
    { $inc: { coin: -plan.totalCoin, spentCoins: plan.totalCoin } }
  );
  if (debit.modifiedCount !== 1) {
    await History.deleteOne({ _id: history._id }).catch(() => {});
    throw new GiftError("INSUFFICIENT_COINS", "You don't have enough coins.");
  }

  try {
    const credit = await Host.updateOne({ _id: plan.receiver._id }, { $inc: { coin: plan.hostEarnings, totalGifts: plan.count } });
    if (credit.modifiedCount !== 1) throw new GiftError("HOST_NOT_FOUND", "Receiver host not found.");
  } catch (err) {
    // the host was not paid -> give the coins back and drop the record, the user can retry
    await User.updateOne({ _id: plan.sender._id }, { $inc: { coin: plan.totalCoin, spentCoins: -plan.totalCoin } }).catch((e) =>
      console.error("[GIFT_RECONCILE] REFUND FAILED sender=" + plan.sender._id + " coins=" + plan.totalCoin, e.message)
    );
    await History.deleteOne({ _id: history._id }).catch(() => {});
    throw err;
  }

  try {
    if (plan.agency && plan.agencyShare > 0) {
      const agencyTotal = money(plan.hostEarnings + plan.agencyShare);
      await Agency.updateOne(
        { _id: plan.agency._id },
        {
          $inc: {
            hostCoins: plan.hostEarnings,
            totalEarnings: plan.agencyShare,
            netAvailableEarnings: agencyTotal,
            totalEarningsWithCommissionAndHostCoin: agencyTotal,
          },
        }
      );
    }
    if (plan.roomId) {
      await LiveBroadcastHistory.updateOne({ _id: plan.roomId }, { $inc: { coins: plan.totalCoin, gifts: plan.count } });
    }
  } catch (err) {
    console.error(`[GIFT_RECONCILE] agency/live totals not updated history=${history._id}:`, err.message);
  }

  return history;
};

/**
 * Live gift (user -> host). Idempotent per (sender, giftRequestId), atomic when Mongo supports
 * transactions, compensating otherwise.
 * @returns {{ok:boolean, duplicate?:boolean, error?:string, message?:string, senderCoin?:number, hostCoin?:number, giftRequestId?:string}}
 */
const processGift = async ({ io, socket, data }) => {
  const giftData = typeof data === "string" ? JSON.parse(data) : data || {};
  const { senderId, receiverId, giftId } = giftData;
  const giftRequestId = str(giftData.giftRequestId) || "";

  const fail = (error, message) => {
    const out = { ok: false, error, message: message || error, giftRequestId };
    io.in(`globalRoom:${senderId}`).emit("liveGiftError", out);
    return out;
  };

  if (!isId(senderId) || !isId(receiverId) || !isId(giftId)) return fail("INVALID_REQUEST", "Invalid gift request.");

  const count = Number(giftData.giftCount);
  if (!Number.isInteger(count) || count <= 0 || count > 9999) return fail("INVALID_COUNT", "Invalid gift count.");

  // ---- fast duplicate guard (the unique index below is the real one)
  const dedupeKey = giftRequestId ? `${senderId}:${giftRequestId}` : "";
  if (dedupeKey) {
    const prior = processedGifts.get(dedupeKey);
    if (prior) return prior.result ? { ...prior.result, duplicate: true } : { ok: true, duplicate: true, giftRequestId };
    processedGifts.set(dedupeKey, { at: Date.now(), result: null }); // in flight
  }
  const release = (result) => {
    if (!dedupeKey) return result;
    if (result.ok) processedGifts.set(dedupeKey, { at: Date.now(), result });
    else processedGifts.delete(dedupeKey); // a failed gift may be retried with the same id
    if (processedGifts.size > 5000) {
      const now = Date.now();
      for (const [k, v] of processedGifts) if (now - v.at > GIFT_TTL_MS) processedGifts.delete(k);
    }
    return result;
  };

  try {
    // ---- the room the gift belongs to (never trust the client id)
    const analytics = getAnalytics();
    let roomId = null;
    if (analytics && analytics.resolveRoomId) {
      roomId =
        (await analytics.resolveRoomId({
          liveHistoryId: giftData.liveHistoryId,
          hostId: receiverId,
          userId: senderId,
          socket,
          trust: "host",
        })) || null;
    }
    if (roomId && !isId(roomId)) roomId = null;

    if (roomId) {
      const history = await LiveBroadcastHistory.findById(roomId).select("_id endTime").lean();
      if (history && !isOpen(history)) {
        return release(fail("LIVE_ENDED", "This live has ended."));
      }
    }

    const [sender, receiver, gift] = await Promise.all([
      User.findOne({ _id: senderId, isBlock: false }).select("_id coin").lean(),
      Host.findOne({ _id: receiverId, isBlock: false }).select("_id coin totalGifts agencyId").lean(),
      Gift.findOne({ _id: giftId }).select("_id coin image type svgaImage").lean(),
    ]);
    if (!sender) return release(fail("SENDER_NOT_FOUND", "Sender not found."));
    if (!receiver) return release(fail("HOST_NOT_FOUND", "Receiver host not found."));
    if (!gift) return release(fail("GIFT_NOT_FOUND", "Gift not found."));

    const coinPerGift = Math.abs(Number(gift.coin || 0));
    if (coinPerGift <= 0) return release(fail("INVALID_PRICE", "Invalid gift price."));

    const totalCoin = coinPerGift * count;
    if (Number(sender.coin || 0) < totalCoin) return release(fail("INSUFFICIENT_COINS", "You don't have enough coins."));

    const adminRate = Number(global.settingJSON?.adminCommissionRate ?? 10);
    const adminShare = money((totalCoin * adminRate) / 100);
    const hostPool = money(totalCoin - adminShare);

    let agency = null;
    let agencyShare = 0;
    let hostEarnings = hostPool;
    if (receiver.agencyId && isId(receiver.agencyId)) {
      agency = await Agency.findById(receiver.agencyId).select("_id commissionType commission").lean();
      if (agency && Number(agency.commissionType) === 1) {
        agencyShare = money((hostPool * Number(agency.commission || 0)) / 100);
        hostEarnings = money(hostPool - agencyShare);
      }
    }

    const uniqueId = await generateHistoryUniqueId();
    const historyDoc = {
      uniqueId,
      type: 2,
      userId: sender._id,
      hostId: receiver._id,
      agencyId: receiver.agencyId || null,
      giftId: gift._id,
      giftRequestId: giftRequestId || null,
      liveHistoryId: roomId || null,
      giftCoin: coinPerGift,
      giftImage: gift.image || "",
      giftsvgaImage: gift.svgaImage || "",
      giftType: gift.type || 1,
      giftCount: count,
      userCoin: totalCoin,
      adminCoin: adminShare,
      agencyCoin: agencyShare,
      hostCoin: hostEarnings,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };

    const plan = { sender, receiver, gift, agency, agencyShare, hostEarnings, totalCoin, count, roomId, historyDoc };

    let historyRow;
    try {
      try {
        historyRow = await giftWithTransaction(plan);
      } catch (err) {
        if (isTransactionUnsupported(err)) historyRow = await giftWithoutTransaction(plan);
        else throw err;
      }
    } catch (err) {
      if (err && err.code === 11000) {
        // this giftRequestId was already charged -> not a failure, never charge again
        log("LIVE_GIFT", { result: "duplicate_blocked", senderId: str(senderId), giftRequestId });
        return release({ ok: true, duplicate: true, giftRequestId });
      }
      if (err instanceof GiftError) return release(fail(err.code, err.message));
      throw err;
    }

    // ---- fresh balances (authoritative)
    const [senderNow, hostNow, roomNow] = await Promise.all([
      User.findById(sender._id).select("coin").lean(),
      Host.findById(receiver._id).select("coin totalGifts").lean(),
      roomId ? LiveBroadcastHistory.findById(roomId).select("coins gifts").lean() : null,
    ]);

    const realtimeData = {
      ...giftData,
      liveHistoryId: roomId ? String(roomId) : str(giftData.liveHistoryId),
      giftRequestId,
      historyId: String(historyRow._id),
      giftId: String(gift._id),
      giftCount: count,
      giftCoin: coinPerGift,
      totalCoin,
      adminCoin: adminShare,
      agencyCoin: agencyShare,
      hostCoin: hostEarnings,
      giftImage: gift.image || "",
      giftsvgaImage: gift.svgaImage || "",
      giftType: gift.type || 1,
      senderId: String(sender._id),
      receiverId: String(receiver._id),
    };

    // ONE delivery per socket: room first, then the host's own room ONLY if it is not in the live room
    if (roomId) {
      io.in(String(roomId)).emit("liveGiftReceived", realtimeData);
      io.in(`globalRoom:${receiver._id}`).except(String(roomId)).emit("liveGiftReceived", realtimeData);
    } else {
      io.in(`globalRoom:${receiver._id}`).emit("liveGiftReceived", realtimeData);
    }

    // host earnings (wallet) + live earnings, pushed to every device of the host
    io.in(`globalRoom:${receiver._id}`).emit("walletBalanceUpdated", {
      hostId: String(receiver._id),
      coins: Number(hostNow?.coin ?? 0),
      addedCoins: hostEarnings,
      reason: "LIVE_GIFT",
    });
    if (roomId) {
      const earned = await sessionHostCoins(roomId);
      io.in(`globalRoom:${receiver._id}`).emit("liveEarningsUpdate", {
        liveHistoryId: String(roomId),
        sessionCoins: earned.hostCoins, // host's own share (not the gross coins)
        sessionGifts: earned.gifts || Number(roomNow?.gifts ?? 0),
        hostCoin: Number(hostNow?.coin ?? 0),
        addedCoins: hostEarnings,
        giftRequestId,
      });
    }

    // sender wallet
    io.in(`globalRoom:${sender._id}`).emit("userCoinUpdated", { userId: String(sender._id), coin: Number(senderNow?.coin ?? 0) });

    if (analytics && analytics.notifyGift) {
      analytics.notifyGift({
        historyId: historyRow._id,
        uniqueId,
        liveHistoryId: roomId,
        senderId: sender._id,
        hostId: receiver._id,
        giftId: gift._id,
        giftCount: count,
        giftCoin: coinPerGift,
        totalCoin,
        hostCoin: hostEarnings,
        agencyCoin: agencyShare,
        adminCoin: adminShare,
      });
    }

    log("LIVE_GIFT", {
      result: "ok",
      giftRequestId,
      senderId: String(sender._id),
      hostId: String(receiver._id),
      roomId: roomId ? String(roomId) : null,
      totalCoin,
      hostEarnings,
    });

    return release({
      ok: true,
      giftRequestId,
      historyId: String(historyRow._id),
      senderCoin: Number(senderNow?.coin ?? 0),
      hostCoin: Number(hostNow?.coin ?? 0),
    });
  } catch (err) {
    console.error("[LIVE_GIFT] failed:", err);
    return release(fail("SERVER_ERROR", "Unable to process gift."));
  }
};

// ---------------------------------------------------------------------------
// liveSync: the app calls it when it joins AND after every reconnect / app resume
// ---------------------------------------------------------------------------
const buildViewerToken = (channel) => {
  try {
    const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
    const s = global.settingJSON;
    if (!s || !s.agoraAppId || !s.agoraAppCertificate || !channel) return "";
    // long lives must not lose their viewers to an expired token (the app can also call liveSync for a fresh one)
    const hours = Number(process.env.LIVE_VIEWER_TOKEN_HOURS) > 0 ? Number(process.env.LIVE_VIEWER_TOKEN_HOURS) : 24;
    const expire = Math.floor(Date.now() / 1000) + Math.floor(hours * 3600);
    return RtcTokenBuilder.buildTokenWithUid(s.agoraAppId, s.agoraAppCertificate, channel, 0, RtcRole.SUBSCRIBER, expire);
  } catch (_) {
    return "";
  }
};

/** coins the HOST earned in this live (sum of his share of every gift) - source of truth = History */
const sessionHostCoins = async (liveHistoryId) => {
  try {
    const rows = await History.aggregate([
      { $match: { type: 2, liveHistoryId: new mongoose.Types.ObjectId(String(liveHistoryId)) } },
      { $group: { _id: null, hostCoins: { $sum: "$hostCoin" }, gifts: { $sum: "$giftCount" } } },
    ]);
    return { hostCoins: Number(rows[0]?.hostCoins || 0), gifts: Number(rows[0]?.gifts || 0) };
  } catch (_) {
    return { hostCoins: 0, gifts: 0 };
  }
};

/** public state of a live (HTTP LiveStatus + liveSync) */
const getLiveState = async (liveHistoryId) => {
  const active = await getActiveLive(liveHistoryId);
  if (!active) return { isLive: false, liveHistoryId: str(liveHistoryId) };
  const b = active.broadcaster;
  return {
    isLive: true,
    liveHistoryId: String(b.liveHistoryId),
    hostId: String(b.hostId),
    name: b.name || "",
    image: imageOf(b.image),
    channel: b.channel || "",
    agoraUid: b.agoraUid || 0,
    token: buildViewerToken(b.channel),
    totalViews: await LiveBroadcastView.countDocuments({ liveHistoryId }),
  };
};

/**
 * @returns the complete state the app needs. For a viewer it also (re)joins; for the host it only
 * (re)enters the room (and announces "host joined" once per session).
 */
const liveSync = async ({ io, socket, data }) => {
  const p = typeof data === "string" ? JSON.parse(data) : data || {};
  const liveHistoryId = p.liveHistoryId;

  const state = await getLiveState(liveHistoryId);
  if (!state.isLive) {
    rejectJoin(io, socket, liveHistoryId);
    return { ok: false, isLive: false, reason: "LIVE_ENDED", liveHistoryId: str(liveHistoryId) };
  }
  const roomId = state.liveHistoryId;

  const isHostOfRoom =
    Boolean(socket.data?.isHost) && str(socket.data?.hostId) !== "" && str(socket.data.hostId) === state.hostId;

  if (isHostOfRoom) {
    socket.join(roomId);
    socket.data.liveHistoryId = roomId;

    if (!global.hostJoinAnnounced) global.hostJoinAnnounced = new Set();
    if (!global.hostJoinAnnounced.has(roomId)) {
      global.hostJoinAnnounced.add(roomId);
      systemMessage(io, roomId, {
        senderId: state.hostId,
        userId: state.hostId,
        userName: getDisplayName(state.name, state.hostId),
        userImage: state.image,
        commentText: `🎥 ${getDisplayName(state.name, state.hostId)} started the live 🔴`,
        isHostJoined: true,
      }, state.hostId);
    }
    state.participants = await listParticipants(roomId);
    const earned = await sessionHostCoins(roomId);
    state.sessionHostCoins = earned.hostCoins;
    state.sessionGifts = earned.gifts;
    state.token = ""; // the host already has its publisher token
  } else {
    const userId = p.userId || socket.data?.userId;
    const joined = await joinViewer({ io, socket, userId, liveHistoryId });
    if (!joined.ok) return { ok: false, isLive: joined.reason !== "LIVE_ENDED", reason: joined.reason, liveHistoryId: roomId };

    if (joined.isNew && p.userName) {
      systemMessage(io, roomId, {
        senderId: str(userId),
        userId: str(userId),
        userName: getDisplayName(p.userName, userId),
        userImage: str(p.userImage),
        commentText: "✨ joined the LIVE 👋🔥",
      }, state.hostId);
    }
    state.totalViews = joined.totalViews;
  }

  state.ok = true;
  state.isHost = isHostOfRoom;
  state.recentComments = await loadRecentComments(roomId);
  return state;
};

module.exports = {
  getActiveLive,
  getLiveState,
  joinViewer,
  leaveViewer,
  handleSocketDisconnect,
  reconcileViewers,
  startViewerSweep,
  listParticipants,
  getAudience,
  getRecentComments,
  loadRecentComments,
  emitToLive,
  sendComment,
  systemMessage,
  processGift,
  liveSync,
  clearRoomState,
  rejectJoin,
};
