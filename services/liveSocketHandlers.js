/**
 * LIVE socket handlers + host presence (grace period / room restore).
 *
 * Everything the app emits while a live is running is registered HERE, by ONE function that
 * socket.js calls for EVERY authenticated socket (host or viewer) BEFORE any role specific code.
 * (Root cause of "host comments never arrive / audience empty / live ends by itself": the host
 * branch of the connection handler used to `return` early, so host sockets never received these
 * handlers - no comments, no heartbeat, no liveStreamEnd, no disconnect cleanup.)
 *
 * Business logic stays in liveRoom.service.js (inside a live) and liveSession.service.js (lifecycle).
 */
const Host = require("../models/host.model");
const liveRoomService = require("./liveRoom.service");
const liveSessionService = require("./liveSession.service");

const log = (tag, data) => console.log(`[${tag}]`, JSON.stringify(data));
const ackOf = (cb) => (typeof cb === "function" ? cb : () => {});
const parse = (data) => {
  if (typeof data === "string") return JSON.parse(data);
  return data || {};
};

// ---------------------------------------------------------------------------
// Host connection dropped while LIVE (flaky internet, app switch, network change):
// wait for the host to come back BEFORE ending the live for everybody.
// ---------------------------------------------------------------------------
const liveDisconnectTimers = new Map(); // hostId -> Timeout

/** read at call time so it can be tuned (and tested) through the environment */
const getGraceMs = () => {
  const n = Number(process.env.LIVE_DISCONNECT_GRACE_SECONDS);
  return (n > 0 ? n : 60) * 1000;
};

const cancelLiveDisconnectGrace = (hostId) => {
  const key = String(hostId);
  const t = liveDisconnectTimers.get(key);
  if (t) {
    clearTimeout(t);
    liveDisconnectTimers.delete(key);
    log("LIVE_GRACE", { hostId: key, result: "cancelled_host_reconnected" });
  }
};

const scheduleLiveDisconnectGrace = (io, hostId, historyId, globalRoom) => {
  const key = String(hostId);
  if (liveDisconnectTimers.has(key)) clearTimeout(liveDisconnectTimers.get(key));

  const timer = setTimeout(async () => {
    liveDisconnectTimers.delete(key);
    try {
      const sockets = await io.in(globalRoom).fetchSockets();
      if (sockets.length > 0) {
        log("LIVE_GRACE", { hostId: key, historyId: String(historyId), result: "host_reconnected_live_continues" });
        return;
      }

      log("LIVE_GRACE", { hostId: key, historyId: String(historyId), result: "host_did_not_return_ending_live" });
      await liveSessionService.finalizeLiveSession({ hostId: key, historyId, reason: "socket-disconnect" });

      // only reset the host when no NEWER live is attached to it
      await Host.updateOne(
        { _id: key, $or: [{ liveHistoryId: null }, { liveHistoryId: { $exists: false } }] },
        { $set: { isOnline: false, isBusy: false, isLive: false, callId: null } }
      );
      if (typeof global.emitHostStatusUpdate === "function") await global.emitHostStatusUpdate(key);
    } catch (err) {
      console.error("[LIVE_GRACE] failed:", err);
    }
  }, getGraceMs());
  if (timer.unref) timer.unref();

  liveDisconnectTimers.set(key, timer);
};

/**
 * A HOST socket connected (first connect OR reconnect). If the host is live, the server puts the
 * socket back into the live room by itself (viewer joins / leaves / counts reach the host again
 * without waiting for the app) and cancels a pending grace-period end.
 */
const restoreHostLiveRoom = async (io, socket, hostId) => {
  try {
    cancelLiveDisconnectGrace(hostId);
    const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();
    if (!host || !host.isLive || !host.liveHistoryId) return null;

    const active = await liveRoomService.getActiveLive(host.liveHistoryId);
    if (!active) return null;

    const roomId = String(host.liveHistoryId);
    socket.join(roomId);
    socket.data.liveHistoryId = roomId;
    log("LIVE_HOST_RESTORE", { hostId: String(hostId), roomId });
    return roomId;
  } catch (err) {
    console.error("[LIVE_HOST_RESTORE] failed:", err.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------
const registerLiveSocketHandlers = (io, socket) => {
  // ONE call that (re)joins and returns the whole live state. The app uses it on join, after every
  // socket reconnect and when it comes back from background.
  socket.on("liveSync", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const result = await liveRoomService.liveSync({ io, socket, data });
      ack(result);
      if (result && result.ok && Array.isArray(result.recentComments)) {
        socket.emit("liveCommentHistory", result.recentComments);
      }
    } catch (error) {
      console.error("liveSync Error:", error);
      ack({ ok: false, reason: "SERVER_ERROR" });
    }
  });

  // legacy join event (older app builds) -> same code path
  socket.on("liveRoomJoin", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const parsed = parse(data);
      const userId = parsed.userId || socket.data?.hostId || socket.data?.userId || "";
      const result = await liveRoomService.liveSync({ io, socket, data: { ...parsed, userId } });
      if (result && result.ok) {
        socket.emit("liveRoomJoin", JSON.stringify({ liveHistoryId: result.liveHistoryId }));
        if (Array.isArray(result.recentComments)) socket.emit("liveCommentHistory", result.recentComments);
      }
      ack(result);
    } catch (error) {
      console.error("liveRoomJoin Error:", error);
      ack({ ok: false, reason: "SERVER_ERROR" });
    }
  });

  // host asks "who is in my live?" (audience bottom sheet). Paged, authoritative (database), and
  // answered through the ack AND the liveParticipantsList event.
  socket.on("liveParticipantsRequest", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const parsed = parse(data);
      const active = await liveRoomService.getActiveLive(parsed.liveHistoryId);
      if (!active) return ack({ ok: false, reason: "LIVE_ENDED" });

      const audience = await liveRoomService.getAudience(parsed.liveHistoryId, {
        limit: parsed.limit,
        skip: parsed.skip,
      });
      const payload = { liveHistoryId: String(parsed.liveHistoryId), ...audience };
      socket.emit("liveParticipantsList", payload);
      ack({ ok: true, ...payload });
    } catch (error) {
      console.error("liveParticipantsRequest Error:", error);
      ack({ ok: false, reason: "SERVER_ERROR" });
    }
  });

  socket.on("liveStreamStatusCheck", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const dataOfCheck = typeof data === "string" ? JSON.parse(data) : data;
      const { liveHistoryId, hostId } = dataOfCheck || {};

      // a live is ONLY live while its session is open (not merely while a broadcaster row exists)
      const active = liveHistoryId ? await liveRoomService.getActiveLive(liveHistoryId) : null;
      const payload = {
        hostId: hostId || "",
        liveHistoryId: liveHistoryId || "",
        liveStatus: !!active,
      };
      socket.emit("liveStreamStatusCheck", payload);
      ack(payload);
    } catch (error) {
      console.error("[liveStreamStatusCheck] Error:", error);
      const payload = { hostId: "", liveHistoryId: "", liveStatus: false };
      socket.emit("liveStreamStatusCheck", payload);
      ack(payload);
    }
  });

  // legacy "add view" -> same join logic (idempotent)
  socket.on("liveJoinerCount", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const parsed = parse(data);
      const result = await liveRoomService.joinViewer({
        io,
        socket,
        userId: parsed.userId || socket.data?.userId,
        liveHistoryId: parsed.liveHistoryId,
      });
      ack({ ok: !!result.ok, reason: result.reason, totalViews: result.totalViews });
    } catch (error) {
      console.error("[liveJoinerCount] Error:", error);
      ack({ ok: false, reason: "SERVER_ERROR" });
    }
  });

  // viewer leaves (button / back). Disconnects are handled in the "disconnect" handler.
  socket.on("removeLiveJoiner", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const parsed = parse(data);
      const roomId = parsed.liveHistoryId ? String(parsed.liveHistoryId) : "";
      const result = await liveRoomService.leaveViewer({
        io,
        userId: parsed.userId || socket.data?.userId,
        liveHistoryId: parsed.liveHistoryId,
      });
      if (roomId && socket.rooms.has(roomId)) socket.leave(roomId);
      ack({ ok: true, ...result });
    } catch (error) {
      console.error("[removeLiveJoiner] Error:", error);
      ack({ ok: false });
    }
  });

  // chat: validated, de-duplicated (clientMsgId), rate limited, acknowledged
  socket.on("liveCommentBroadcast", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const result = await liveRoomService.sendComment({ io, socket, data });
      if (!result.ok) socket.emit("liveCommentError", { error: result.error });
      ack(result);
    } catch (error) {
      console.error("[liveCommentBroadcast] Error:", error);
      socket.emit("liveCommentError", { error: "SERVER_ERROR" });
      ack({ ok: false, error: "SERVER_ERROR" });
    }
  });

  // gifts: idempotent (giftRequestId) + transactional, see liveRoom.service.processGift
  socket.on("liveGiftSent", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      ack(await liveRoomService.processGift({ io, socket, data }));
    } catch (error) {
      console.error("❌ liveGiftSent Error:", error);
      ack({ ok: false, error: "SERVER_ERROR" });
    }
  });

  // Host app proof-of-life while LIVE (every ~20s). Identity comes from the authenticated socket.
  socket.on("liveHeartbeat", async () => {
    try {
      if (!socket.data || !socket.data.isHost || !socket.data.hostId) return;
      const state = await liveSessionService.recordHeartbeat(socket.data.hostId);
      socket.emit("liveHeartbeatAck", state);
    } catch (error) {
      console.error("liveHeartbeat ERROR =>", error.message);
    }
  });

  // explicit END by the host (the ONLY app-side way to end a live)
  socket.on("liveStreamEnd", async (data, cb) => {
    const ack = ackOf(cb);
    try {
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      const { hostId, liveHistoryId } = parsedData || {};
      if (!hostId || !liveHistoryId) return ack({ ok: false, reason: "INVALID_REQUEST" });

      // PERMISSION: only the host that owns the room may end it from the app.
      const ownerDoc = await Host.findById(hostId).select("_id userId").lean();
      const me = String(socket.data?.userId || "");
      const myHost = String(socket.data?.hostId || "");
      const allowed =
        !!ownerDoc &&
        [String(ownerDoc._id), String(ownerDoc.userId || "")].some((x) => x && (x === me || x === myHost));
      if (!allowed) {
        console.warn(`⛔ liveStreamEnd rejected: socket user ${me} is not the owner of host ${hostId}`);
        socket.emit("liveStreamEndError", { liveHistoryId, message: "You are not allowed to end this live room." });
        return ack({ ok: false, reason: "NOT_ALLOWED" });
      }

      const trustedHostId = socket.data && socket.data.isHost && socket.data.hostId ? socket.data.hostId : hostId;

      // Atomic + idempotent finalize (DB first). finalizeLiveSession then tells the whole room
      // (liveStreamEnd), empties it and refreshes host lists / daily task / command center.
      const endResult = await liveSessionService.finalizeLiveSession({
        hostId: trustedHostId,
        historyId: liveHistoryId,
        reason: "liveStreamEnd",
      });

      if (endResult.notOwner || endResult.notFound) {
        return ack({ ok: false, reason: endResult.notOwner ? "NOT_ALLOWED" : "NOT_FOUND" });
      }

      log("LIVE_END", {
        via: "socket",
        hostId: String(trustedHostId),
        finalized: !!endResult.finalized,
        alreadyEnded: !!endResult.alreadyEnded,
      });
      ack({ ok: true, finalized: !!endResult.finalized, alreadyEnded: !!endResult.alreadyEnded });
    } catch (error) {
      console.error("❌ Error in liveStreamEnd:", error);
      ack({ ok: false, reason: "SERVER_ERROR" });
    }
  });
};

module.exports = {
  registerLiveSocketHandlers,
  restoreHostLiveRoom,
  scheduleLiveDisconnectGrace,
  cancelLiveDisconnectGrace,
  getGraceMs,
};
