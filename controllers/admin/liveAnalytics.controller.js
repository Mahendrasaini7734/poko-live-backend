const mongoose = require("mongoose");
const moment = require("moment-timezone");

const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const Gift = require("../../models/gift.model");
const History = require("../../models/history.model");
const LiveSession = require("../../models/liveSession.model");
const LiveAdminAudit = require("../../models/liveAdminAudit.model");
const LiveComment = require("../../models/liveComment.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const Room = require("../../models/room.model");
const liveAnalytics = require("../../services/liveAnalytics.service");

const { FINANCE_GROUP, cleanFinance, HISTORY_GIFT_IN_LIVE } = liveAnalytics;

const TZ = process.env.ANALYTICS_TZ || "Asia/Kolkata";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;
const oid = (v) => new mongoose.Types.ObjectId(String(v));

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const bad = (res, message) => res.status(400).json({ status: false, message });

const fail = (res, tag, error) => {
  console.error(`[liveAnalytics.${tag}]`, error);
  return res.status(500).json({ status: false, message: "Internal Server Error" });
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePaging = (q) => {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const search = String(q.search || "").trim().slice(0, 100);
  const sortOrder = q.sortOrder === "asc" ? 1 : -1;
  return { page, limit, search, sortOrder };
};

/** { total, page, limit, totalPages, hasNextPage, hasPreviousPage } */
const pageMeta = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
};

const sendList = (res, total, page, limit, data, extra = {}) =>
  res.status(200).json({ status: true, message: "Success", ...pageMeta(total, page, limit), data, ...extra });

/** today | yesterday | week | month | custom  ->  { from, to } (server timezone) or { error } */
const resolveRange = (q) => {
  const range = String(q.range || "today").toLowerCase();
  const now = moment.tz(TZ);

  if (range === "today") return { from: now.clone().startOf("day"), to: now.clone().endOf("day") };
  if (range === "yesterday") {
    const y = now.clone().subtract(1, "day");
    return { from: y.clone().startOf("day"), to: y.clone().endOf("day") };
  }
  if (range === "week") return { from: now.clone().startOf("isoWeek"), to: now.clone().endOf("isoWeek") };
  if (range === "month") return { from: now.clone().startOf("month"), to: now.clone().endOf("month") };

  if (range === "custom") {
    const { startDate, endDate } = q;
    if (!DATE_RE.test(startDate || "") || !DATE_RE.test(endDate || ""))
      return { error: "startDate and endDate (YYYY-MM-DD) are required for a custom range." };
    const from = moment.tz(startDate, "YYYY-MM-DD", true, TZ).startOf("day");
    const to = moment.tz(endDate, "YYYY-MM-DD", true, TZ).endOf("day");
    if (!from.isValid() || !to.isValid()) return { error: "Invalid date." };
    if (from.isAfter(to)) return { error: "startDate must be before endDate." };
    if (to.diff(from, "days") > MAX_RANGE_DAYS)
      return { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days.` };
    return { from, to };
  }
  return { error: "Invalid range. Use today, yesterday, week, month or custom." };
};

/** in-memory search / sort / paginate for the small "live right now" lists */
const listFromRows = (rows, q, { searchFields, sortFields, defaultSort }) => {
  const { page, limit, search, sortOrder } = parsePaging(q);

  let out = rows;
  if (search) {
    const s = search.toLowerCase();
    out = out.filter((r) =>
      searchFields.some((f) => {
        const v = f.split(".").reduce((o, k) => (o ? o[k] : undefined), r);
        return v !== undefined && v !== null && String(v).toLowerCase().includes(s);
      })
    );
  }

  const sortBy = sortFields.includes(q.sortBy) ? q.sortBy : defaultSort;
  out = [...out].sort((a, b) => {
    const x = a[sortBy];
    const y = b[sortBy];
    if (x === y) return 0;
    if (x === undefined || x === null) return 1;
    if (y === undefined || y === null) return -1;
    return (x > y ? 1 : -1) * sortOrder;
  });

  return { page, limit, total: out.length, data: out.slice((page - 1) * limit, page * limit) };
};

const secondsExpr = (now) => ({
  $cond: [{ $ifNull: ["$leftAt", false] }, "$duration", { $divide: [{ $subtract: [now, "$joinedAt"] }, 1000] }],
});

// ---------------------------------------------------------------------------
// shared: History(type 2) rows -> API rows (sender / host / gift profiles resolved in 3 queries)
// ---------------------------------------------------------------------------
const GIFT_ROW_FIELDS =
  "uniqueId userId hostId giftId giftCount giftCoin userCoin hostCoin agencyCoin adminCoin liveHistoryId createdAt";

async function mapGiftRows(rows) {
  const uniq = (key) => [...new Set(rows.map((r) => (r[key] ? String(r[key]) : "")).filter(Boolean))];
  const [users, hosts, gifts] = await Promise.all([
    User.find({ _id: { $in: uniq("userId") } }).select("name image uniqueId").lean(),
    Host.find({ _id: { $in: uniq("hostId") } }).select("name image uniqueId").lean(),
    Gift.find({ _id: { $in: uniq("giftId") } }).select("coin name imageUrl imageKey").lean(),
  ]);
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const hMap = new Map(hosts.map((h) => [String(h._id), h]));
  const gMap = new Map(gifts.map((g) => [String(g._id), g]));

  return rows.map((r) => {
    const u = uMap.get(String(r.userId));
    const h = hMap.get(String(r.hostId));
    const g = gMap.get(String(r.giftId));
    return {
      transactionId: String(r._id),
      uniqueId: r.uniqueId,
      at: r.createdAt,
      roomId: r.liveHistoryId ? String(r.liveHistoryId) : "",
      user: { userId: String(r.userId), name: u?.name || "", image: liveAnalytics.imgUrl(u?.image), uniqueId: u?.uniqueId || "" },
      host: { hostId: String(r.hostId), name: h?.name || "", image: liveAnalytics.imgUrl(h?.image), uniqueId: h?.uniqueId || "" },
      giftId: String(r.giftId),
      giftName: g?.name || "",
      giftImage: liveAnalytics.imgUrl(g?.imageUrl || g?.imageKey || ""),
      giftCoin: r.giftCoin,
      quantity: r.giftCount,
      grossCoins: r.userCoin,
      hostCoins: r.hostCoin,
      agencyCoins: r.agencyCoin,
      adminCoins: r.adminCoin,
    };
  });
}

/** REST gift row -> same shape as the realtime socket feed entry */
const giftToFeedEntry = (row, roomHost) =>
  liveAnalytics.decorate({
  id: row.transactionId,
  type: "gift",
  at: row.at,
  roomId: row.roomId,
  user: row.user,
  host: roomHost || row.host,
  data: {
    transactionId: row.transactionId,
    giftId: row.giftId,
    giftName: row.giftName,
    giftImage: row.giftImage,
    giftCoin: row.giftCoin,
    quantity: row.quantity,
    grossCoins: row.grossCoins,
    hostCoins: row.hostCoins,
    agencyCoins: row.agencyCoins,
    adminCoins: row.adminCoins,
  },
  });

// ---------------------------------------------------------------------------
// GET /overview
// ---------------------------------------------------------------------------
exports.overview = async (req, res) => {
  try {
    const [snap, today] = await Promise.all([liveAnalytics.getSnapshot(), liveAnalytics.todayTotals()]);
    return res.status(200).json({
      status: true,
      message: "Success",
      data: { ...snap.counters, today, serverTime: new Date().toISOString() },
    });
  } catch (error) {
    return fail(res, "overview", error);
  }
};

// ---------------------------------------------------------------------------
// GET /live-hosts   /live-users   /live-rooms
// ---------------------------------------------------------------------------
exports.liveHosts = async (req, res) => {
  try {
    const snap = await liveAnalytics.getSnapshot();
    const r = listFromRows([...snap.hosts.values()], req.query, {
      searchFields: ["name", "uniqueId", "roomId", "roomTitle"],
      sortFields: ["name", "viewers", "startedAt", "giftCoins", "hostCoins", "agencyCoins", "adminCoins", "gifts"],
      defaultSort: "startedAt",
    });
    return sendList(res, r.total, r.page, r.limit, r.data);
  } catch (error) {
    return fail(res, "liveHosts", error);
  }
};

exports.liveUsers = async (req, res) => {
  try {
    const snap = await liveAnalytics.getSnapshot();
    const roomFilter = String(req.query.roomId || "");
    const allUsers = [...snap.users.values()].filter((u) => !roomFilter || u.roomId === roomFilter);
    const r = listFromRows(allUsers, req.query, {
      searchFields: ["name", "uniqueId", "roomId", "hostName"],
      sortFields: ["name", "joinedAt", "hostName", "giftsSent", "coinsSpent"],
      defaultSort: "joinedAt",
    });
    return sendList(res, r.total, r.page, r.limit, r.data);
  } catch (error) {
    return fail(res, "liveUsers", error);
  }
};

exports.liveRooms = async (req, res) => {
  try {
    const snap = await liveAnalytics.getSnapshot();
    const rows = [...snap.rooms.values()].map((r) => ({ ...r, hostName: r.host?.name || "" }));
    const r = listFromRows(rows, req.query, {
      searchFields: ["roomId", "title", "hostName", "host.uniqueId"],
      sortFields: ["viewers", "totalJoined", "startedAt", "title", "giftCoins", "gifts", "lastActivityAt"],
      defaultSort: "startedAt",
    });
    return sendList(res, r.total, r.page, r.limit, r.data);
  } catch (error) {
    return fail(res, "liveRooms", error);
  }
};

/**
 * Participants of ONE room from the persisted LiveSession rows, scoped by roomId + userId:
 * join / left time, status and gifts / coins sent in THIS room (History is the source of truth).
 * `endedAt` (finished room) forces every still-open row to LEFT at the room end time.
 */
async function sessionParticipants(roomId, { onlyLeft = false, endedAt = null } = {}) {
  const rid = oid(roomId);
  const filter = { roomId: rid, role: "viewer" };
  if (onlyLeft) filter.leftAt = { $ne: null };
  const [sessions, spent] = await Promise.all([
    LiveSession.find(filter).sort({ joinedAt: -1 }).limit(200).lean(),
    History.aggregate([
      { $match: { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: rid } },
      { $group: { _id: "$userId", gifts: { $sum: "$giftCount" }, coins: { $sum: "$userCoin" } } },
    ]),
  ]);
  const ids = [...new Set(sessions.map((x) => String(x.userId || "")).filter(Boolean))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select("name image uniqueId").lean() : [];
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const spentMap = new Map(spent.map((x) => [String(x._id), x]));

  return sessions.map((x) => {
    const u = uMap.get(String(x.userId));
    const st = spentMap.get(String(x.userId));
    const leftAt = x.leftAt || endedAt || null;
    return {
      userId: String(x.userId || ""),
      name: u?.name || "",
      image: liveAnalytics.imgUrl(u?.image),
      uniqueId: u?.uniqueId || "",
      roomId: String(roomId),
      joinedAt: x.joinedAt,
      leftAt,
      status: leftAt ? "offline" : "live",
      giftsSent: st?.gifts || 0,
      coinsSpent: round2(st?.coins),
    };
  });
}

/** Finished room (history only): same shape as a live room so the admin UI needs no special case. */
async function buildEndedRoom(roomId) {
  const rid = oid(roomId);
  const [hist, party] = await Promise.all([
    LiveBroadcastHistory.findById(rid).select("hostId startTime endTime").lean(),
    Room.findById(rid).select("name hostId startedAt endedAt createdAt").lean(),
  ]);
  const doc = hist || party;
  if (!doc) return null;

  const toIso = (v) => {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d.toISOString() : null;
  };
  const startedAt = toIso(hist ? hist.startTime : party.startedAt || party.createdAt);
  const endedAt = toIso(hist ? hist.endTime : party.endedAt);
  const host = doc.hostId ? await Host.findById(doc.hostId).select("name image uniqueId").lean() : null;
  const hostObj = {
    hostId: doc.hostId ? String(doc.hostId) : "",
    name: host?.name || "",
    image: liveAnalytics.imgUrl(host?.image),
    uniqueId: host?.uniqueId || "",
  };

  const participants = await sessionParticipants(roomId, { endedAt });
  const ids = [...new Set(participants.map((p) => p.userId).filter(Boolean))];

  return {
    room: {
      roomId: String(roomId),
      source: hist ? "broadcast" : "room",
      title: party?.name || "",
      hostId: hostObj.hostId,
      host: hostObj,
      viewers: 0,
      totalJoined: new Set(ids).size,
      startedAt,
      endedAt,
      lastActivityAt: endedAt || startedAt,
      status: "ended",
    },
    participants,
  };
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// ---------------------------------------------------------------------------
// GET /live-rooms/:roomId   (full room command view)
// ---------------------------------------------------------------------------
exports.liveRoomDetail = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return bad(res, "Invalid roomId.");

    const snap = await liveAnalytics.getSnapshot();
    let room = snap.rooms.get(String(roomId));
    let participants;
    if (room) {
      const current = [...snap.users.values()].filter((u) => u.roomId === room.roomId);
      // users who already left stay in the table (with Left At + frozen duration)
      const left = await sessionParticipants(room.roomId, { onlyLeft: true });
      participants = [...current, ...left].sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
    } else {
      // not live any more -> the admin can still inspect the finished room
      const ended = await buildEndedRoom(roomId);
      if (!ended) {
        return res
          .status(200)
          .json({ status: true, message: "Room not found.", data: { room: null } });
      }
      room = ended.room;
      participants = ended.participants;
    }

    const [sessions, financeMap, topAgg] = await Promise.all([
      LiveSession.find({ roomId: oid(room.roomId) })
        .sort({ updatedAt: -1 })
        .limit(40)
        .select("userId hostId role joinedAt leftAt")
        .lean(),
      liveAnalytics.roomFinanceMap([room.roomId]),
      History.aggregate([
        { $match: { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: oid(room.roomId) } },
        { $group: { _id: "$userId", coins: { $sum: "$userCoin" }, gifts: { $sum: "$giftCount" } } },
        { $sort: { coins: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const userIds = [...new Set(sessions.map((s) => s.userId).filter(Boolean).map(String))];
    const nameMap = new Map();
    if (userIds.length) {
      const users = await User.find({ _id: { $in: userIds } }).select("name").lean();
      users.forEach((u) => nameMap.set(String(u._id), u.name || "User"));
    }

    const activity = [];
    sessions.forEach((s) => {
      const name = s.role === "host" ? room.host?.name || "Host" : nameMap.get(String(s.userId)) || "User";
      const who = s.role === "host" ? `Host ${name}` : name;
      activity.push({ at: s.joinedAt, type: "join", message: `${who} ${s.role === "host" ? "started the live" : "joined"}` });
      if (s.leftAt)
        activity.push({ at: s.leftAt, type: "leave", message: `${who} ${s.role === "host" ? "ended the live" : "left"}` });
    });
    activity.sort((a, b) => new Date(b.at) - new Date(a.at));

    // ---- finance (History is the single source of truth, nothing is calculated here) ----
    const f = financeMap.get(room.roomId) || { ...cleanFinance({}), uniqueSenders: 0 };
    let topSender = null;
    if (topAgg[0]) {
      const u = await User.findById(topAgg[0]._id).select("name image uniqueId").lean();
      topSender = {
        userId: String(topAgg[0]._id),
        name: u?.name || "",
        image: liveAnalytics.imgUrl(u?.image),
        uniqueId: u?.uniqueId || "",
        coins: topAgg[0].coins,
        gifts: topAgg[0].gifts,
      };
    }
    const finance = {
      gifts: f.gifts,
      transactions: f.transactions,
      grossCoins: f.grossCoins,
      hostCoins: f.hostCoins,
      agencyCoins: f.agencyCoins,
      adminCoins: f.adminCoins,
      uniqueSenders: f.uniqueSenders,
      avgGiftValue: f.gifts > 0 ? Math.round((f.grossCoins / f.gifts) * 100) / 100 : 0,
      topSender,
      mismatch: f.mismatch === true,
    };

    const bufs = liveAnalytics.getRoomBuffers(room.roomId);

    return res.status(200).json({
      status: true,
      message: "Success",
      data: {
        room,
        host: room.host,
        participants,
        activity: activity.slice(0, 40),
        finance,
        counts: (await roomEventCounts(room.roomId)).counts,
        serverTime: new Date().toISOString(),
        recentComments: [...bufs.comments].reverse().slice(0, 50),
        recentGifts: [...bufs.gifts].reverse().slice(0, 30),
      },
    });
  } catch (error) {
    return fail(res, "liveRoomDetail", error);
  }
};

// ---------------------------------------------------------------------------
// GET /live-rooms/:roomId/comments   (persisted, newest first, paginated - survives restarts)
// ---------------------------------------------------------------------------
const commentToFeedEntry = (c, roomHost) =>
  liveAnalytics.decorate({
    id: c.feedId,
    type: "comment",
    at: c.createdAt,
    roomId: String(c.roomId),
    user: { userId: c.userId, name: c.name, image: c.image, uniqueId: c.uniqueId || "" },
    host: roomHost || null,
    data: { text: c.text },
  });

exports.roomComments = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return bad(res, "Invalid roomId.");
    const { page, limit, search } = parsePaging(req.query);
    const match = { roomId: oid(roomId) };
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      match.$or = [{ name: rx }, { text: rx }];
    }
    const [total, rows] = await Promise.all([
      LiveComment.countDocuments(match),
      LiveComment.find(match)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return sendList(res, total, page, limit, rows.map((c) => commentToFeedEntry(c)));
  } catch (error) {
    return fail(res, "roomComments", error);
  }
};

// ---------------------------------------------------------------------------
// GET /live-rooms/:roomId/gifts   (History rows of this room, paginated)
// ---------------------------------------------------------------------------
exports.roomGifts = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return bad(res, "Invalid roomId.");
    const { page, limit } = parsePaging(req.query);
    const match = { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: oid(roomId) };

    const [total, rows] = await Promise.all([
      History.countDocuments(match),
      History.find(match)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(GIFT_ROW_FIELDS)
        .lean(),
    ]);
    return sendList(res, total, page, limit, await mapGiftRows(rows));
  } catch (error) {
    return fail(res, "roomGifts", error);
  }
};

// ---------------------------------------------------------------------------
// GET /live-rooms/:roomId/activity
//   Complete timeline of ONE room (works for live AND ended rooms):
//   comments + gifts + joins / leaves + room start / end, newest first, paginated.
//   type=comment,gift,join,leave,roomStarted,roomEnded   search=<name|text>
// ---------------------------------------------------------------------------
const MAX_ACTIVITY_WINDOW = 5000; // page * limit upper bound (keeps the merge bounded)

const FILTER_RX = (search) => new RegExp(escapeRegex(search), "i");

/** start / end of a room: LiveSession(host) first, LiveBroadcastHistory / Room as fallback */
async function roomLifecycle(roomId) {
  const rid = oid(roomId);
  const [sess, hist, party] = await Promise.all([
    LiveSession.findOne({ roomId: rid, role: "host" }).sort({ joinedAt: 1 }).lean(),
    LiveBroadcastHistory.findById(rid).select("hostId startTime endTime").lean(),
    Room.findById(rid).select("hostId startedAt endedAt createdAt").lean(),
  ]);
  const iso = (v) => {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  };
  const startedAt = iso(sess?.joinedAt) || iso(hist?.startTime) || iso(party?.startedAt || party?.createdAt);
  const endedAt = iso(sess?.leftAt) || iso(hist?.endTime) || iso(party?.endedAt);
  const hostId = sess?.hostId || hist?.hostId || party?.hostId || null;
  return { startedAt, endedAt, hostId: hostId ? String(hostId) : "" };
}

/**
 * Per-type counts of ONE room, straight from the database (comments, gifts, joins, leaves, room events).
 * `counts` feeds the tab badges, so a badge is always the real record count - never a page length.
 */
async function roomEventCounts(roomId, life) {
  const rid = oid(roomId);
  const [comment, gift, join, leave] = await Promise.all([
    LiveComment.countDocuments({ roomId: rid }),
    History.countDocuments({ type: HISTORY_GIFT_IN_LIVE, liveHistoryId: rid }),
    LiveSession.countDocuments({ roomId: rid, role: "viewer" }),
    LiveSession.countDocuments({ roomId: rid, role: "viewer", leftAt: { $ne: null } }),
  ]);
  const l = life || (await roomLifecycle(roomId));
  const roomStarted = l.startedAt ? 1 : 0;
  const roomEnded = l.endedAt ? 1 : 0;
  const byType = { comment, gift, join, leave, roomStarted, roomEnded };
  const counts = {
    all: comment + gift + join + leave + roomStarted + roomEnded,
    comment,
    gift,
    member: join + leave,
    room: roomStarted + roomEnded,
  };
  return { byType, counts };
}

exports.roomActivity = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return bad(res, "Invalid roomId.");
    const { page, limit, search } = parsePaging(req.query);
    const types = String(req.query.type || "")
      .split(",")
      .filter((t) => ACTIVITY_TYPES.includes(t));
    const want = (t) => !types.length || types.includes(t);
    const rid = oid(roomId);
    const skip = (page - 1) * limit;
    const take = skip + limit;
    if (take > MAX_ACTIVITY_WINDOW) return bad(res, "Page is too deep. Use the filters / search to narrow the list.");

    const [snap, life] = await Promise.all([liveAnalytics.getSnapshot(), roomLifecycle(roomId)]);
    const liveRoom = snap.rooms.get(String(roomId));
    let roomHost = liveRoom?.host
      ? { hostId: liveRoom.hostId, name: liveRoom.host.name, image: liveRoom.host.image, uniqueId: liveRoom.host.uniqueId }
      : null;
    if (!roomHost && life.hostId && mongoose.Types.ObjectId.isValid(life.hostId)) {
      const h = await Host.findById(life.hostId).select("name image uniqueId").lean();
      roomHost = { hostId: life.hostId, name: h?.name || "", image: liveAnalytics.imgUrl(h?.image), uniqueId: h?.uniqueId || "" };
    }

    // ---- search is applied INSIDE the queries so totals / pages stay exact ----
    let rx = null;
    let searchUserIds = null;
    if (search) {
      rx = FILTER_RX(search);
      searchUserIds = (await User.find({ name: rx }).select("_id").limit(200).lean()).map((u) => u._id);
    }
    const qComment = rx ? { roomId: rid, $or: [{ name: rx }, { text: rx }] } : { roomId: rid };
    const qGift = { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: rid, ...(rx ? { userId: { $in: searchUserIds } } : {}) };
    const qViewer = { roomId: rid, role: "viewer", ...(rx ? { userId: { $in: searchUserIds } } : {}) };
    const qLeft = { ...qViewer, leftAt: { $ne: null } };
    const hostMatches = !rx || rx.test(roomHost?.name || "");
    const roomEvt = { roomStarted: want("roomStarted") && !!life.startedAt && hostMatches, roomEnded: want("roomEnded") && !!life.endedAt && hostMatches };

    const [cmt, gifts, joins, leaves, nComment, nGift, nJoin, nLeave, audits] = await Promise.all([
      want("comment") ? LiveComment.find(qComment).sort({ createdAt: -1, _id: -1 }).limit(take).lean() : [],
      want("gift") ? History.find(qGift).sort({ createdAt: -1, _id: -1 }).limit(take).select(GIFT_ROW_FIELDS).lean() : [],
      want("join") ? LiveSession.find(qViewer).sort({ joinedAt: -1, _id: -1 }).limit(take).lean() : [],
      want("leave") ? LiveSession.find(qLeft).sort({ leftAt: -1, _id: -1 }).limit(take).lean() : [],
      want("comment") ? LiveComment.countDocuments(qComment) : 0,
      want("gift") ? History.countDocuments(qGift) : 0,
      want("join") ? LiveSession.countDocuments(qViewer) : 0,
      want("leave") ? LiveSession.countDocuments(qLeft) : 0,
      roomEvt.roomStarted || roomEvt.roomEnded
        ? LiveAdminAudit.find({ roomId: String(roomId), action: { $in: ["START_ROOM", "END_ROOM"] }, status: "success" }).lean()
        : [],
    ]);
    const total = nComment + nGift + nJoin + nLeave + (roomEvt.roomStarted ? 1 : 0) + (roomEvt.roomEnded ? 1 : 0);

    // ---- merge raw rows by time, slice the requested page, THEN hydrate profiles (cheap) ----
    const { FEED_ID } = liveAnalytics;
    const raw = [];
    cmt.forEach((c) => raw.push({ k: "comment", at: new Date(c.createdAt), row: c, id: c.feedId }));
    gifts.forEach((g) => raw.push({ k: "gift", at: new Date(g.createdAt), row: g, id: String(g._id) }));
    joins.forEach((x) => raw.push({ k: "join", at: new Date(x.joinedAt), row: x, id: FEED_ID.join(roomId, x.userId, x.joinedAt) }));
    leaves.forEach((x) => raw.push({ k: "leave", at: new Date(x.leftAt), row: x, id: FEED_ID.leave(roomId, x.userId, x.joinedAt) }));
    if (roomEvt.roomStarted) raw.push({ k: "roomStarted", at: life.startedAt, row: null, id: FEED_ID.roomStarted(roomId) });
    if (roomEvt.roomEnded) raw.push({ k: "roomEnded", at: life.endedAt, row: null, id: FEED_ID.roomEnded(roomId) });

    raw.sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1));
    const pageRows = raw.slice(skip, skip + limit);

    const giftRows = await mapGiftRows(pageRows.filter((r) => r.k === "gift").map((r) => r.row));
    const giftMap = new Map(giftRows.map((g) => [g.transactionId, g]));
    const viewerIds = [...new Set(pageRows.filter((r) => r.k === "join" || r.k === "leave").map((r) => String(r.row.userId || "")).filter(Boolean))];
    const users = viewerIds.length ? await User.find({ _id: { $in: viewerIds } }).select("name image uniqueId").lean() : [];
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    const auditOf = (action) => audits.find((a) => a.action === action);

    const data = pageRows.map((r) => {
      if (r.k === "comment") return commentToFeedEntry(r.row, roomHost);
      if (r.k === "gift") return giftToFeedEntry(giftMap.get(r.id), roomHost);
      if (r.k === "join" || r.k === "leave") {
        const u = uMap.get(String(r.row.userId));
        const user = { userId: String(r.row.userId || ""), name: u?.name || "", image: liveAnalytics.imgUrl(u?.image), uniqueId: u?.uniqueId || "" };
        return liveAnalytics.decorate({ id: r.id, type: r.k, at: r.at, roomId: String(roomId), user, host: roomHost, data: {} });
      }
      const au = auditOf(r.k === "roomStarted" ? "START_ROOM" : "END_ROOM");
      return liveAnalytics.decorate({
        id: r.id,
        type: r.k,
        at: r.at,
        roomId: String(roomId),
        user: null,
        host: roomHost,
        data: { actorType: au?.actorType || "host", actorName: au?.actorName || roomHost?.name || "", endedBy: au?.metadata?.endedBy || "", reason: au?.reason || "" },
      });
    });

    const { counts } = await roomEventCounts(roomId, life);
    return sendList(res, total, page, limit, data, { counts, serverTime: new Date().toISOString() });
  } catch (error) {
    return fail(res, "roomActivity", error);
  }
};

// ---------------------------------------------------------------------------
// GET /activity   (global realtime activity feed, newest first)
// ---------------------------------------------------------------------------
const ACTIVITY_TYPES = ["comment", "gift", "join", "leave", "roomStarted", "roomEnded"];

exports.activity = async (req, res) => {
  try {
    const { page, limit, search } = parsePaging(req.query);
    const types = String(req.query.type || "")
      .split(",")
      .filter((t) => ACTIVITY_TYPES.includes(t));
    const roomId = String(req.query.roomId || "");

    let list = [...liveAnalytics.getActivity()].reverse();
    if (types.length) list = list.filter((a) => types.includes(a.type));
    if (roomId) list = list.filter((a) => a.roomId === roomId);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.user?.name || "").toLowerCase().includes(s) ||
          (a.host?.name || "").toLowerCase().includes(s) ||
          (a.roomId || "").includes(s) ||
          (a.data?.text || "").toLowerCase().includes(s)
      );
    }
    return sendList(res, list.length, page, limit, list.slice((page - 1) * limit, page * limit));
  } catch (error) {
    return fail(res, "activity", error);
  }
};

// ---------------------------------------------------------------------------
// POST /live-rooms/:roomId/end     (audited)
// ---------------------------------------------------------------------------
/**
 * Who may end a live room:
 *   - the main admin (req.admin), or
 *   - a staff member whose role grants "Delete" (or "End") on the "Live Analytics" module.
 * Anyone else gets 403 and the room is NOT touched.
 */
const END_MODULE = "Live Analytics";
const canEndRoom = (req) => {
  if (req.admin) return true;
  const perms = req.subadmin?.role?.permissions;
  if (!req.subadmin || !Array.isArray(perms)) return false;
  const m = perms.find((p) => p.module === END_MODULE);
  return !!m && (m.actions || []).some((a) => a === "Delete" || a === "End");
};

// GET /permissions  -> lets the UI check BEFORE it opens the confirmation modal (server still re-checks)
exports.permissions = async (req, res) =>
  res.status(200).json({ status: true, message: "Success", data: { canEndRoom: canEndRoom(req) } });

exports.endRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return bad(res, "Invalid roomId.");

    if (!canEndRoom(req)) {
      console.warn(`[liveAnalytics.endRoom] permission denied for ${req.admin?._id || req.subadmin?._id || "unknown"}`);
      return res.status(403).json({ status: false, message: "You do not have permission to end a live room." });
    }

    const reason = String(req.body?.reason || "").trim().slice(0, 200);
    const r = await liveAnalytics.endRoom(roomId, req.admin || req.subadmin, reason);
    if (!r.ok) return res.status(r.status || 400).json({ status: false, message: r.message });
    return res.status(200).json({ status: true, message: "Live room ended successfully.", data: r.data });
  } catch (error) {
    return fail(res, "endRoom", error);
  }
};

// ---------------------------------------------------------------------------
// GET /audit
// ---------------------------------------------------------------------------
exports.audit = async (req, res) => {
  try {
    const { page, limit, search } = parsePaging(req.query);
    const match = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      match.$or = [{ adminEmail: rx }, { actorName: rx }, { action: rx }, { roomId: rx }, { targetId: rx }];
    }
    const [total, rows] = await Promise.all([
      LiveAdminAudit.countDocuments(match),
      LiveAdminAudit.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    const data = rows.map((a) => ({
      id: String(a._id),
      adminId: a.adminId ? String(a.adminId) : null,
      adminEmail: a.adminEmail,
      actorType: a.actorType || "admin",
      actorId: a.actorId || (a.adminId ? String(a.adminId) : ""),
      actorName: a.actorName || a.adminEmail || "",
      reason: a.reason || a.metadata?.reason || "",
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId,
      roomId: a.roomId,
      status: a.status,
      metadata: a.metadata,
      at: a.createdAt,
    }));
    return sendList(res, total, page, limit, data);
  } catch (error) {
    return fail(res, "audit", error);
  }
};

// ---------------------------------------------------------------------------
// GET /users   (User Analytics)
//   filter: total | new | active (default) | joinedLive | returning
//   status: all | live | online | offline | blocked
// ---------------------------------------------------------------------------
const USER_SORTS = {
  createdAt: "createdAt",
  lastActive: "updatedAt",
  liveSessions: "liveSessions",
  totalLiveTime: "totalLiveTime",
};
const USER_FILTERS = ["total", "new", "active", "joinedLive", "returning"];
const STATUS_FILTERS = ["all", "live", "online", "offline", "blocked"];

exports.users = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const from = r.from.toDate();
    const to = r.to.toDate();
    const now = new Date();
    const { page, limit, search, sortOrder } = parsePaging(req.query);
    const filter = USER_FILTERS.includes(req.query.filter) ? req.query.filter : "active";
    const status = STATUS_FILTERS.includes(req.query.status) ? req.query.status : "all";

    const snap = await liveAnalytics.getSnapshot();
    const liveIds = [...new Set([...snap.users.values()].map((u) => u.userId))]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map(oid);

    const and = [];
    if (filter === "active") and.push({ updatedAt: { $gte: from, $lte: to } });
    if (filter === "new") and.push({ createdAt: { $gte: from, $lte: to } });
    if (filter === "returning") and.push({ updatedAt: { $gte: from, $lte: to }, createdAt: { $lt: from } });
    if (filter === "joinedLive") {
      const ids = (await LiveSession.distinct("userId", { role: "viewer", joinedAt: { $gte: from, $lte: to } })).filter(Boolean);
      and.push({ _id: { $in: ids } });
    }
    if (status === "live") and.push({ _id: { $in: liveIds } });
    if (status === "online") and.push({ isOnline: true, _id: { $nin: liveIds } });
    if (status === "offline") and.push({ isOnline: { $ne: true } });
    if (status === "blocked") and.push({ isBlock: true });
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      and.push({ $or: [{ name: rx }, { uniqueId: rx }] });
    }
    const match = and.length ? { $and: and } : {};

    const sortKey = USER_SORTS[req.query.sortBy] || "updatedAt";
    const sortsBySession = sortKey === "liveSessions" || sortKey === "totalLiveTime";

    const sessionLookup = {
      $lookup: {
        from: LiveSession.collection.name,
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          { $match: { role: "viewer", joinedAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id: null,
              liveSessions: { $sum: 1 },
              totalLiveTime: { $sum: secondsExpr(now) },
            },
          },
        ],
        as: "s",
      },
    };

    const project = {
      $project: {
        name: 1,
        image: 1,
        uniqueId: 1,
        isBlock: 1,
        isOnline: 1,
        createdAt: 1,
        updatedAt: 1,
        s: 1,
        liveSessions: 1,
        totalLiveTime: 1,
      },
    };

    const sortStage = { $sort: { [sortKey]: sortOrder, _id: 1 } };
    const paging = [{ $skip: (page - 1) * limit }, { $limit: limit }];

    const pipeline = sortsBySession
      ? [
          { $match: match },
          sessionLookup,
          {
            $addFields: {
              liveSessions: { $ifNull: [{ $first: "$s.liveSessions" }, 0] },
              totalLiveTime: { $ifNull: [{ $first: "$s.totalLiveTime" }, 0] },
            },
          },
          sortStage,
          ...paging,
          project,
        ]
      : [{ $match: match }, sortStage, ...paging, sessionLookup, project];

    const [rows, total, totalUsers, newUsers, activeUsers, returningUsers, joinedAgg] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(match),
      User.estimatedDocumentCount(),
      User.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      User.countDocuments({ updatedAt: { $gte: from, $lte: to } }),
      User.countDocuments({ updatedAt: { $gte: from, $lte: to }, createdAt: { $lt: from } }),
      LiveSession.aggregate([
        { $match: { role: "viewer", joinedAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$userId" } },
        { $count: "n" },
      ]),
    ]);

    const liveUserIds = new Set(liveIds.map(String));

    const data = rows.map((u) => {
      const id = String(u._id);
      const s = u.s?.[0] || {};
      const st = liveUserIds.has(id) ? "live" : u.isOnline ? "online" : "offline";
      return {
        userId: id,
        name: u.name || "",
        image: liveAnalytics.imgUrl(u.image),
        uniqueId: u.uniqueId || "",
        registeredAt: u.createdAt,
        lastActive: u.isOnline ? now : u.updatedAt,
        liveSessions: u.liveSessions ?? s.liveSessions ?? 0,
        totalLiveTime: Math.round(u.totalLiveTime ?? s.totalLiveTime ?? 0),
        isBlock: !!u.isBlock,
        status: st,
      };
    });

    return sendList(res, total, page, limit, data, {
      filter,
      summary: {
        totalUsers,
        newUsers,
        activeUsers,
        usersJoinedLive: joinedAgg?.[0]?.n || 0,
        returningUsers,
      },
    });
  } catch (error) {
    return fail(res, "users", error);
  }
};

// ---------------------------------------------------------------------------
// GET /hosts   (Host Analytics)
//   filter: total (default) | active | live      status: all | live | online | offline | blocked
// ---------------------------------------------------------------------------
const HOST_SORTS = ["totalLiveSessions", "totalLiveDuration", "totalViewers", "averageViewers", "lastLive"];
const HOST_FILTERS = ["total", "active", "live"];

exports.hosts = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const from = r.from.toDate();
    const to = r.to.toDate();
    const now = new Date();
    const { page, limit, search, sortOrder } = parsePaging(req.query);
    const filter = HOST_FILTERS.includes(req.query.filter) ? req.query.filter : "total";
    const status = STATUS_FILTERS.includes(req.query.status) ? req.query.status : "all";

    const snap = await liveAnalytics.getSnapshot();
    const liveHostIds = [...snap.hosts.keys()].filter((id) => mongoose.Types.ObjectId.isValid(id)).map(oid);

    const and = [{ status: 2 }];
    if (filter === "live" || status === "live") and.push({ _id: { $in: liveHostIds } });
    if (status === "online") and.push({ isOnline: true, _id: { $nin: liveHostIds } });
    if (status === "offline") and.push({ isOnline: { $ne: true } });
    if (status === "blocked") and.push({ isBlock: true });
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      and.push({ $or: [{ name: rx }, { uniqueId: rx }] });
    }
    const match = { $and: and };
    const sortKey = HOST_SORTS.includes(req.query.sortBy) ? req.query.sortBy : "totalLiveSessions";

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: LiveSession.collection.name,
          localField: "_id",
          foreignField: "hostId",
          pipeline: [
            { $match: { role: "host", joinedAt: { $gte: from, $lte: to } } },
            {
              $group: {
                _id: null,
                totalLiveSessions: { $sum: 1 },
                totalLiveDuration: { $sum: secondsExpr(now) },
                lastLive: { $max: { $ifNull: ["$leftAt", now] } },
              },
            },
          ],
          as: "h",
        },
      },
      {
        $lookup: {
          from: LiveSession.collection.name,
          localField: "_id",
          foreignField: "hostId",
          pipeline: [
            { $match: { role: "viewer", joinedAt: { $gte: from, $lte: to } } },
            { $group: { _id: { r: "$roomId", u: "$userId" } } },
            { $count: "n" },
          ],
          as: "v",
        },
      },
      {
        $addFields: {
          totalLiveSessions: { $ifNull: [{ $first: "$h.totalLiveSessions" }, 0] },
          totalLiveDuration: { $ifNull: [{ $first: "$h.totalLiveDuration" }, 0] },
          lastLive: { $first: "$h.lastLive" },
          totalViewers: { $ifNull: [{ $first: "$v.n" }, 0] },
        },
      },
      {
        $addFields: {
          averageViewers: {
            $cond: [{ $gt: ["$totalLiveSessions", 0] }, { $divide: ["$totalViewers", "$totalLiveSessions"] }, 0],
          },
        },
      },
      ...(filter === "active" ? [{ $match: { totalLiveSessions: { $gt: 0 } } }] : []),
      { $sort: { [sortKey]: sortOrder, _id: 1 } },
      {
        $facet: {
          rows: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                name: 1,
                image: 1,
                uniqueId: 1,
                isOnline: 1,
                isLive: 1,
                isBlock: 1,
                totalLiveSessions: 1,
                totalLiveDuration: 1,
                lastLive: 1,
                totalViewers: 1,
                averageViewers: 1,
              },
            },
          ],
          count: [{ $count: "n" }],
        },
      },
    ];

    const summaryAgg = LiveSession.aggregate([
      { $match: { joinedAt: { $gte: from, $lte: to } } },
      {
        $facet: {
          host: [
            { $match: { role: "host" } },
            {
              $group: {
                _id: null,
                sessions: { $sum: 1 },
                duration: { $sum: secondsExpr(now) },
                hosts: { $addToSet: "$hostId" },
              },
            },
          ],
          viewers: [
            { $match: { role: "viewer" } },
            { $group: { _id: { r: "$roomId", u: "$userId" } } },
            { $count: "n" },
          ],
        },
      },
    ]);

    const [agg, totalHosts, summaryRes] = await Promise.all([
      Host.aggregate(pipeline),
      Host.countDocuments({ status: 2 }),
      summaryAgg,
    ]);

    const rows = agg?.[0]?.rows || [];
    const total = agg?.[0]?.count?.[0]?.n || 0;
    const sm = summaryRes?.[0] || {};
    const hostSum = sm.host?.[0] || {};

    const data = rows.map((h) => {
      const id = String(h._id);
      const st = snap.hosts.has(id) ? "live" : h.isOnline ? "online" : "offline";
      return {
        hostId: id,
        name: h.name || "",
        image: liveAnalytics.imgUrl(h.image),
        uniqueId: h.uniqueId || "",
        totalLiveSessions: h.totalLiveSessions || 0,
        totalLiveDuration: Math.round(h.totalLiveDuration || 0),
        totalViewers: h.totalViewers || 0,
        averageViewers: Number((h.averageViewers || 0).toFixed(2)),
        lastLive: h.lastLive || null,
        isBlock: !!h.isBlock,
        status: st,
      };
    });

    return sendList(res, total, page, limit, data, {
      filter,
      summary: {
        totalHosts,
        activeHosts: hostSum.hosts?.length || 0,
        liveHosts: snap.hosts.size,
        totalLiveSessions: hostSum.sessions || 0,
        totalLiveDuration: Math.round(hostSum.duration || 0),
        totalViewers: sm.viewers?.[0]?.n || 0,
      },
    });
  } catch (error) {
    return fail(res, "hosts", error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/rooms   (one row = one live session of a host)
//   status: all | live | ended
// ---------------------------------------------------------------------------
const ROOM_SORTS = {
  startedAt: "joinedAt",
  duration: "durationSec",
  viewers: "viewers",
  grossCoins: "grossCoins",
  gifts: "gifts",
};

exports.roomAnalytics = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const from = r.from.toDate();
    const to = r.to.toDate();
    const now = new Date();
    const { page, limit, search, sortOrder } = parsePaging(req.query);
    const sortKey = ROOM_SORTS[req.query.sortBy] || "joinedAt";
    const status = ["all", "live", "ended"].includes(req.query.status) ? req.query.status : "all";

    const base = { role: "host", joinedAt: { $gte: from, $lte: to } };
    if (status === "live") base.leftAt = null;
    if (status === "ended") base.leftAt = { $ne: null };

    const searchStage = search
      ? (() => {
          const rx = new RegExp(escapeRegex(search), "i");
          return [{ $match: { $or: [{ hostName: rx }, { hostUniqueId: rx }, { roomIdStr: rx }] } }];
        })()
      : [];

    const pipeline = [
      { $match: base },
      {
        $lookup: {
          from: Host.collection.name,
          localField: "hostId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, uniqueId: 1, image: 1 } }],
          as: "h",
        },
      },
      {
        $lookup: {
          from: LiveSession.collection.name,
          localField: "roomId",
          foreignField: "roomId",
          pipeline: [{ $match: { role: "viewer" } }, { $group: { _id: "$userId" } }, { $count: "n" }],
          as: "v",
        },
      },
      {
        $lookup: {
          from: History.collection.name,
          localField: "roomId",
          foreignField: "liveHistoryId",
          pipeline: [{ $match: { type: HISTORY_GIFT_IN_LIVE } }, { $group: { _id: null, ...FINANCE_GROUP } }],
          as: "f",
        },
      },
      {
        $addFields: {
          roomIdStr: { $toString: "$roomId" },
          hostName: { $first: "$h.name" },
          hostUniqueId: { $first: "$h.uniqueId" },
          hostImage: { $first: "$h.image" },
          viewers: { $ifNull: [{ $first: "$v.n" }, 0] },
          fin: { $first: "$f" },
          durationSec: secondsExpr(now),
        },
      },
      ...searchStage,
      {
        $addFields: {
          grossCoins: { $ifNull: ["$fin.grossCoins", 0] },
          gifts: { $ifNull: ["$fin.gifts", 0] },
        },
      },
      { $sort: { [sortKey]: sortOrder, _id: 1 } },
      { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: "n" }] } },
    ];

    const agg = await LiveSession.aggregate(pipeline);
    const rows = agg?.[0]?.rows || [];
    const total = agg?.[0]?.count?.[0]?.n || 0;

    const data = rows.map((x) => ({
      roomId: String(x.roomId),
      source: x.source,
      hostId: x.hostId ? String(x.hostId) : "",
      hostName: x.hostName || "",
      hostUniqueId: x.hostUniqueId || "",
      hostImage: liveAnalytics.imgUrl(x.hostImage),
      startedAt: x.joinedAt,
      endedAt: x.leftAt || null,
      duration: Math.round(x.durationSec || 0),
      uniqueViewers: x.viewers,
      ...cleanFinance(x.fin),
      status: x.leftAt ? "ended" : "live",
    }));
    return sendList(res, total, page, limit, data);
  } catch (error) {
    return fail(res, "roomAnalytics", error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/gifts   (grouped by gift)
// ---------------------------------------------------------------------------
const GIFT_SORTS = ["quantity", "grossCoins", "transactions", "adminCoins", "hostCoins"];

exports.giftAnalytics = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const from = r.from.toDate();
    const to = r.to.toDate();
    const { page, limit, sortOrder } = parsePaging(req.query);
    const sortKey = GIFT_SORTS.includes(req.query.sortBy) ? req.query.sortBy : "grossCoins";
    const match = { type: HISTORY_GIFT_IN_LIVE, createdAt: { $gte: from, $lte: to } };

    const [agg, sum] = await Promise.all([
      History.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$giftId",
            ...FINANCE_GROUP,
            senders: { $addToSet: "$userId" },
          },
        },
        {
          $addFields: {
            quantity: "$gifts",
            uniqueSenders: { $size: "$senders" },
          },
        },
        { $project: { senders: 0 } },
        { $sort: { [sortKey]: sortOrder, _id: 1 } },
        { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: "n" }] } },
      ]),
      History.aggregate([{ $match: match }, { $group: { _id: null, ...FINANCE_GROUP } }]),
    ]);

    const rows = agg?.[0]?.rows || [];
    const total = agg?.[0]?.count?.[0]?.n || 0;
    const gifts = await Gift.find({ _id: { $in: rows.map((x) => x._id).filter(Boolean) } })
      .select("coin imageUrl imageKey")
      .lean();
    const gMap = new Map(gifts.map((g) => [String(g._id), g]));

    const data = rows.map((x) => {
      const g = gMap.get(String(x._id));
      return {
        giftId: x._id ? String(x._id) : "",
        giftImage: liveAnalytics.imgUrl(g?.imageUrl || g?.imageKey || ""),
        giftCoin: g?.coin || 0,
        quantity: x.quantity,
        uniqueSenders: x.uniqueSenders,
        ...cleanFinance(x),
      };
    });
    return sendList(res, total, page, limit, data, { summary: cleanFinance(sum[0]) });
  } catch (error) {
    return fail(res, "giftAnalytics", error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/gift-transactions   (every live gift: sender, host, room, coins - paginated)
//   search: sender name / sender id / host name / host id / room id / transaction id
// ---------------------------------------------------------------------------
exports.giftTransactions = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const { page, limit, search, sortOrder } = parsePaging(req.query);
    const match = { type: HISTORY_GIFT_IN_LIVE, createdAt: { $gte: r.from.toDate(), $lte: r.to.toDate() } };

    const roomFilter = String(req.query.roomId || "");
    if (roomFilter) {
      if (!mongoose.Types.ObjectId.isValid(roomFilter)) return bad(res, "Invalid roomId.");
      match.liveHistoryId = oid(roomFilter);
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or = [{ uniqueId: rx }];
      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ liveHistoryId: oid(search) }, { userId: oid(search) }, { hostId: oid(search) });
      }
      const [uIds, hIds] = await Promise.all([
        User.find({ $or: [{ name: rx }, { uniqueId: rx }] }).select("_id").limit(200).lean(),
        Host.find({ $or: [{ name: rx }, { uniqueId: rx }] }).select("_id").limit(200).lean(),
      ]);
      if (uIds.length) or.push({ userId: { $in: uIds.map((x) => x._id) } });
      if (hIds.length) or.push({ hostId: { $in: hIds.map((x) => x._id) } });
      match.$or = or;
    }

    const sortKey = ["createdAt", "userCoin"].includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const [total, rows, sum] = await Promise.all([
      History.countDocuments(match),
      History.find(match)
        .sort({ [sortKey]: sortOrder, _id: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(GIFT_ROW_FIELDS)
        .lean(),
      History.aggregate([{ $match: match }, { $group: { _id: null, ...FINANCE_GROUP } }]),
    ]);

    return sendList(res, total, page, limit, await mapGiftRows(rows), { summary: cleanFinance(sum[0]) });
  } catch (error) {
    return fail(res, "giftTransactions", error);
  }
};

// ---------------------------------------------------------------------------
// GET /analytics/revenue   (grouped by day, server timezone)
// ---------------------------------------------------------------------------
exports.revenueAnalytics = async (req, res) => {
  try {
    const r = resolveRange(req.query);
    if (r.error) return bad(res, r.error);
    const from = r.from.toDate();
    const to = r.to.toDate();
    const { page, limit, sortOrder } = parsePaging(req.query);
    const match = { type: HISTORY_GIFT_IN_LIVE, createdAt: { $gte: from, $lte: to } };

    const [agg, sum] = await Promise.all([
      History.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } },
            ...FINANCE_GROUP,
          },
        },
        { $sort: { _id: sortOrder } },
        { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: "n" }] } },
      ]),
      History.aggregate([{ $match: match }, { $group: { _id: null, ...FINANCE_GROUP } }]),
    ]);

    const rows = agg?.[0]?.rows || [];
    const total = agg?.[0]?.count?.[0]?.n || 0;
    const data = rows.map((x) => ({ date: x._id, ...cleanFinance(x) }));
    return sendList(res, total, page, limit, data, { summary: cleanFinance(sum[0]) });
  } catch (error) {
    return fail(res, "revenueAnalytics", error);
  }
};
