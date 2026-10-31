/**
 * LIVE ANALYTICS ENGINE
 * ---------------------------------------------------------------------------
 * Single place that knows "who is live right now" and tells the admin panel
 * about every change in real time.
 *
 *   DB write (Host / User / LiveBroadcaster / LiveBroadcastView / Room /
 *             Participant)                                   (existing flow)
 *        -> util/liveAnalyticsPlugin.js  (post hook, observe only)
 *        -> markDirty()                  (throttled, max 1 run / second)
 *        -> reconcile():
 *              1. build a fresh snapshot of live hosts / users / rooms
 *              2. open / close LiveSession rows (history for analytics)
 *              3. diff with the previous snapshot
 *              4. emit small delta events to the admin room
 *
 * A 15 second safety tick runs reconcile() even if no hook fired, so the panel
 * self-heals after any missed write (bulk ops, manual DB edits, crashes ...).
 *
 * NOTE: state is kept in this process. If you ever run more than one Node
 * instance you must add the socket.io redis adapter and run this on one node.
 */
const mongoose = require("mongoose");

const Host = require("../models/host.model");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const Participant = require("../models/participant.model");
const LiveBroadcaster = require("../models/liveBroadcaster.model");
const LiveBroadcastView = require("../models/liveBroadcastView.model");
const LiveBroadcastHistory = require("../models/liveBroadcastHistory.model");
const LiveSession = require("../models/liveSession.model");
const Admin = require("../models/admin.model");
const History = require("../models/history.model");
const Gift = require("../models/gift.model");
const LiveAdminAudit = require("../models/liveAdminAudit.model");
const LiveComment = require("../models/liveComment.model");
const moment = require("moment-timezone");
const { getMediaUrl } = require("../util/media");

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------
const ADMIN_ROOM = "liveAnalytics:admin";

const EVT = {
  update: "liveAnalytics:update",
  hostOnline: "liveAnalytics:hostOnline",
  hostOffline: "liveAnalytics:hostOffline",
  userOnline: "liveAnalytics:userOnline",
  userOffline: "liveAnalytics:userOffline",
  roomStarted: "liveAnalytics:roomStarted",
  roomEnded: "liveAnalytics:roomEnded",
  viewerCountUpdated: "liveAnalytics:viewerCountUpdated",
  presence: "liveAnalytics:presence",
  activity: "liveAnalytics:activity", // { entries: [...] }  comments / gifts / joins / leaves / room events
  earnings: "liveAnalytics:earnings", // { today, rooms: { [roomId]: finance } }  backend authoritative
  audit: "liveAnalytics:audit", // { action, roomId }  a new audit row exists -> admin refetches the log
};

const TZ = process.env.ANALYTICS_TZ || "Asia/Kolkata";
const HISTORY_GIFT_IN_LIVE = 2; // types/constant.js -> HISTORY_TYPE.GIFT_IN_LIVE

const MIN_INTERVAL_MS = 1000; // reconcile at most once per second
const SAFETY_TICK_MS = 15000;
const SNAPSHOT_TTL_MS = 1500; // REST cache so admin spam can't hammer the DB

// Fake (bot) hosts are not real activity -> excluded from analytics.
const INCLUDE_FAKE_HOSTS = false;

const toId = (v) => (v ? String(v) : "");

const isHttp = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

/** User.image is a string, Host.image is { url, key } */
const imgUrl = (v) => {
  if (!v) return "";
  if (typeof v === "string") return isHttp(v) ? v : getMediaUrl(v);
  if (typeof v === "object") {
    if (isHttp(v.url)) return v.url;
    return getMediaUrl(v.key || v.url || "");
  }
  return "";
};

const parseDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------------------
// emit helpers
// ---------------------------------------------------------------------------
const getIo = () => global.io || null;

const emitAdmin = (event, payload) => {
  const io = getIo();
  if (!io) return;
  io.to(ADMIN_ROOM).emit(event, payload);
};

// ---------------------------------------------------------------------------
// snapshot
// ---------------------------------------------------------------------------
/**
 * @returns {Promise<{hosts:Map, users:Map, rooms:Map, sessions:Map, counters:Object, builtAt:number}>}
 *  hosts : hostId            -> row
 *  rooms : roomId            -> row
 *  users : `${userId}:${roomId}` -> row
 *  sessions : key -> session descriptor used for LiveSession history
 */
async function buildSnapshot() {
  const [broadcasters, partyRooms] = await Promise.all([
    LiveBroadcaster.find({}).select("hostId liveHistoryId userId createdAt").lean(),
    Room.find({ status: "live" }).select("name hostId startedAt createdAt").lean(),
  ]);

  const histIds = broadcasters.map((b) => b.liveHistoryId).filter(Boolean);
  const roomIds = partyRooms.map((r) => r._id);
  const hostIds = [
    ...broadcasters.map((b) => b.hostId),
    ...partyRooms.map((r) => r.hostId),
  ].filter(Boolean);

  const [hosts, histories, views, parts] = await Promise.all([
    hostIds.length
      ? Host.find({ _id: { $in: hostIds } })
          .select("name image uniqueId isLive isOnline isFake userId")
          .lean()
      : [],
    histIds.length
      ? LiveBroadcastHistory.find({ _id: { $in: histIds } }).select("startTime").lean()
      : [],
    histIds.length
      ? LiveBroadcastView.find({ liveHistoryId: { $in: histIds } })
          .select("userId liveHistoryId createdAt")
          .lean()
      : [],
    roomIds.length
      ? Participant.find({ roomId: { $in: roomIds }, isActive: true })
          .select("userId roomId joinedAt")
          .lean()
      : [],
  ]);

  const hostMap = new Map(hosts.map((h) => [toId(h._id), h]));
  const histMap = new Map(histories.map((h) => [toId(h._id), h]));

  const hostsOut = new Map();
  const roomsOut = new Map();
  const usersOut = new Map();
  const sessions = new Map();

  const rawViewers = []; // { userId, roomId, hostId, hostName, joinedAt, source }

  const addSession = (s) => {
    const key = `${s.source}:${s.roomId}:${s.role}:${s.role === "host" ? s.hostId : s.userId}`;
    sessions.set(key, s);
  };

  // ---------------- broadcasts (host goes live) ----------------
  const seenBroadcastRooms = new Set();
  for (const b of broadcasters) {
    const roomId = toId(b.liveHistoryId);
    const hostId = toId(b.hostId);
    const host = hostMap.get(hostId);
    if (!roomId || !host || host.isLive !== true) continue; // stale LiveBroadcaster row
    if (!INCLUDE_FAKE_HOSTS && host.isFake) continue;
    if (seenBroadcastRooms.has(roomId) || hostsOut.has(hostId)) continue;
    seenBroadcastRooms.add(roomId);

    const startedAt =
      parseDate(histMap.get(roomId)?.startTime) || parseDate(b.createdAt) || new Date();
    const hostName = host.name || "";

    roomsOut.set(roomId, {
      roomId,
      source: "broadcast",
      title: "",
      hostId,
      host: {
        hostId,
        name: hostName,
        image: imgUrl(host.image),
        uniqueId: host.uniqueId || "",
      },
      viewers: 0,
      totalJoined: 0,
      startedAt: startedAt.toISOString(),
      status: "live",
    });
    hostsOut.set(hostId, {
      hostId,
      name: hostName,
      image: imgUrl(host.image),
      uniqueId: host.uniqueId || "",
      roomId,
      roomTitle: "",
      viewers: 0,
      startedAt: startedAt.toISOString(),
      status: "live",
    });
    addSession({
      source: "broadcast",
      roomId,
      hostId,
      userId: toId(host.userId) || null,
      role: "host",
      joinedAt: startedAt,
    });
  }

  for (const v of views) {
    const roomId = toId(v.liveHistoryId);
    const room = roomsOut.get(roomId);
    if (!room) continue;
    const hostDoc = hostMap.get(room.hostId);
    if (hostDoc && toId(hostDoc.userId) === toId(v.userId)) continue; // host watching himself
    rawViewers.push({
      userId: toId(v.userId),
      roomId,
      hostId: room.hostId,
      hostName: room.host.name,
      joinedAt: parseDate(v.createdAt) || new Date(),
      source: "broadcast",
    });
  }

  // ---------------- party rooms ----------------
  for (const r of partyRooms) {
    const roomId = toId(r._id);
    const hostId = toId(r.hostId);
    const host = hostMap.get(hostId);
    if (!host) continue;
    if (!INCLUDE_FAKE_HOSTS && host.isFake) continue;
    const startedAt = parseDate(r.startedAt) || parseDate(r.createdAt) || new Date();
    const hostName = host.name || "";

    roomsOut.set(roomId, {
      roomId,
      source: "room",
      title: r.name || "",
      hostId,
      host: {
        hostId,
        name: hostName,
        image: imgUrl(host.image),
        uniqueId: host.uniqueId || "",
      },
      viewers: 0,
      totalJoined: 0,
      startedAt: startedAt.toISOString(),
      status: "live",
    });
    if (!hostsOut.has(hostId)) {
      hostsOut.set(hostId, {
        hostId,
        name: hostName,
        image: imgUrl(host.image),
        uniqueId: host.uniqueId || "",
        roomId,
        roomTitle: r.name || "",
        viewers: 0,
        startedAt: startedAt.toISOString(),
        status: "live",
      });
    }
    addSession({
      source: "room",
      roomId,
      hostId,
      userId: toId(host.userId) || null,
      role: "host",
      joinedAt: startedAt,
    });
  }

  for (const p of parts) {
    const roomId = toId(p.roomId);
    const room = roomsOut.get(roomId);
    if (!room) continue;
    const hostDoc = hostMap.get(room.hostId);
    if (hostDoc && toId(hostDoc.userId) === toId(p.userId)) continue; // the host himself
    rawViewers.push({
      userId: toId(p.userId),
      roomId,
      hostId: room.hostId,
      hostName: room.host.name,
      joinedAt: parseDate(p.joinedAt) || new Date(),
      source: "room",
    });
  }

  // ---------------- viewer profiles (User first, Host as fallback) ----------------
  const viewerIds = [...new Set(rawViewers.map((v) => v.userId).filter(Boolean))];
  const validIds = viewerIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const profiles = new Map();
  if (validIds.length) {
    const users = await User.find({ _id: { $in: validIds } })
      .select("name image uniqueId")
      .lean();
    users.forEach((u) =>
      profiles.set(toId(u._id), {
        name: u.name || "",
        image: imgUrl(u.image),
        uniqueId: u.uniqueId || "",
      })
    );
    const missing = validIds.filter((id) => !profiles.has(id));
    if (missing.length) {
      const asHosts = await Host.find({ _id: { $in: missing } })
        .select("name image uniqueId")
        .lean();
      asHosts.forEach((h) =>
        profiles.set(toId(h._id), {
          name: h.name || "",
          image: imgUrl(h.image),
          uniqueId: h.uniqueId || "",
        })
      );
    }
  }

  for (const v of rawViewers) {
    if (!v.userId) continue;
    const key = `${v.userId}:${v.roomId}`;
    if (usersOut.has(key)) continue;
    const prof = profiles.get(v.userId) || { name: "", image: "", uniqueId: "" };
    usersOut.set(key, {
      userId: v.userId,
      name: prof.name,
      image: prof.image,
      uniqueId: prof.uniqueId,
      roomId: v.roomId,
      hostId: v.hostId,
      hostName: v.hostName,
      joinedAt: v.joinedAt.toISOString(),
      status: "live",
    });
    addSession({
      source: v.source,
      roomId: v.roomId,
      hostId: v.hostId,
      userId: v.userId,
      role: "viewer",
      joinedAt: v.joinedAt,
    });
  }

  // viewers per room / host
  usersOut.forEach((u) => {
    const room = roomsOut.get(u.roomId);
    if (room) room.viewers += 1;
  });
  hostsOut.forEach((h) => {
    h.viewers = roomsOut.get(h.roomId)?.viewers || 0;
  });

  return { hosts: hostsOut, users: usersOut, rooms: roomsOut, sessions, builtAt: Date.now() };
}

const computeCounters = (snap) => {
  const liveUsers = snap.users.size;
  const liveHosts = snap.hosts.size;
  let totalViewers = 0;
  snap.rooms.forEach((r) => {
    totalViewers += r.viewers;
  });
  return {
    liveUsers,
    liveHosts,
    participants: liveUsers + liveHosts,
    liveRooms: snap.rooms.size,
    totalViewers,
  };
};

// ---------------------------------------------------------------------------
// LiveSession history (viewer / host sessions)
// ---------------------------------------------------------------------------
const openSessions = new Map(); // key -> { _id, joinedAt }
let openSessionsLoaded = false;

const sessionKeyOfDoc = (d) =>
  `${d.source}:${toId(d.roomId)}:${d.role}:${d.role === "host" ? toId(d.hostId) : toId(d.userId)}`;

async function loadOpenSessions() {
  const docs = await LiveSession.find({ leftAt: null })
    .select("source roomId hostId userId role joinedAt")
    .lean();
  docs.forEach((d) => openSessions.set(sessionKeyOfDoc(d), { _id: d._id, joinedAt: d.joinedAt }));
  openSessionsLoaded = true;
}

async function syncSessions(wanted) {
  if (!openSessionsLoaded) await loadOpenSessions();

  const toOpen = [];
  wanted.forEach((s, key) => {
    if (!openSessions.has(key)) toOpen.push([key, s]);
  });
  const toClose = [];
  openSessions.forEach((val, key) => {
    if (!wanted.has(key)) toClose.push([key, val]);
  });

  if (toOpen.length) {
    const docs = toOpen.map(([, s]) => ({
      source: s.source,
      roomId: s.roomId,
      hostId: s.hostId || null,
      userId: s.userId && mongoose.Types.ObjectId.isValid(s.userId) ? s.userId : null,
      role: s.role,
      joinedAt: s.joinedAt,
    }));
    const created = await LiveSession.insertMany(docs, { ordered: true });
    created.forEach((doc, i) =>
      openSessions.set(toOpen[i][0], { _id: doc._id, joinedAt: doc.joinedAt })
    );
  }

  if (toClose.length) {
    const now = new Date();
    // native driver on purpose: the update is an aggregation pipeline (no mongoose casting)
    await LiveSession.collection.bulkWrite(
      toClose.map(([, val]) => ({
        updateOne: {
          filter: { _id: val._id, leftAt: null }, // never overwrite a finalized session
          update: [
            {
              $set: {
                leftAt: now,
                updatedAt: now,
                duration: {
                  $max: [
                    0,
                    { $round: [{ $divide: [{ $subtract: [now, "$joinedAt"] }, 1000] }, 0] },
                  ],
                },
              },
            },
          ],
        },
      })),
      { ordered: false }
    );
    toClose.forEach(([key]) => openSessions.delete(key));
  }
}

const MISMATCH_TOLERANCE = 0.05; // coins

/** $group stage fields shared by every History(type 2) aggregation */
const FINANCE_GROUP = {
  gifts: { $sum: "$giftCount" },
  transactions: { $sum: 1 },
  grossCoins: { $sum: "$userCoin" },
  hostCoins: { $sum: "$hostCoin" },
  agencyCoins: { $sum: "$agencyCoin" },
  adminCoins: { $sum: "$adminCoin" },
  mismatched: {
    $sum: {
      $cond: [
        {
          $gt: [
            {
              $abs: {
                $subtract: ["$userCoin", { $add: ["$hostCoin", "$agencyCoin", "$adminCoin"] }],
              },
            },
            MISMATCH_TOLERANCE,
          ],
        },
        1,
        0,
      ],
    },
  },
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const cleanFinance = (f = {}) => ({
  gifts: f.gifts || 0,
  transactions: f.transactions || 0,
  grossCoins: round2(f.grossCoins),
  hostCoins: round2(f.hostCoins),
  agencyCoins: round2(f.agencyCoins),
  adminCoins: round2(f.adminCoins),
  // true when ANY single transaction does not satisfy gross = host + agency + admin
  mismatch: (f.mismatched || 0) > 0 || undefined,
});

const EMPTY_FINANCE = cleanFinance({});

/** finance per live room id (History is the single source of truth) */
async function roomFinanceMap(roomIds) {
  const ids = roomIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  if (!ids.length) return new Map();
  const rows = await History.aggregate([
    { $match: { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: { $in: ids } } },
    { $group: { _id: "$liveHistoryId", ...FINANCE_GROUP, senders: { $addToSet: "$userId" } } },
  ]);
  return new Map(
    rows.map((r) => [
      toId(r._id),
      { ...cleanFinance(r), uniqueSenders: r.senders?.length || 0 },
    ])
  );
}

/** today's live-gift totals (server timezone) */
async function todayTotals() {
  const from = moment.tz(TZ).startOf("day").toDate();
  const to = moment.tz(TZ).endOf("day").toDate();
  const rows = await History.aggregate([
    { $match: { type: HISTORY_GIFT_IN_LIVE, createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: null, ...FINANCE_GROUP } },
  ]);
  return cleanFinance(rows[0]);
}

async function attachExtras(snap) {
  if (!snap.rooms.size) return;
  const roomIds = [...snap.rooms.keys()];
  const objIds = roomIds.map((id) => new mongoose.Types.ObjectId(id));

  const [joined, finance, userStats] = await Promise.all([
    LiveSession.aggregate([
      { $match: { role: "viewer", roomId: { $in: objIds } } },
      { $group: { _id: { r: "$roomId", u: "$userId" } } },
      { $group: { _id: "$_id.r", n: { $sum: 1 } } },
    ]),
    roomFinanceMap(roomIds),
    History.aggregate([
      { $match: { type: HISTORY_GIFT_IN_LIVE, liveHistoryId: { $in: objIds } } },
      {
        $group: {
          _id: { r: "$liveHistoryId", u: "$userId" },
          giftsSent: { $sum: "$giftCount" },
          coinsSpent: { $sum: "$userCoin" },
        },
      },
    ]),
  ]);

  const joinedMap = new Map(joined.map((r) => [toId(r._id), r.n]));
  snap.rooms.forEach((room, id) => {
    room.totalJoined = Math.max(joinedMap.get(id) || 0, room.viewers);
    const f = finance.get(id) || EMPTY_FINANCE;
    room.gifts = f.gifts;
    room.giftCoins = f.grossCoins;
    room.hostCoins = f.hostCoins;
    room.agencyCoins = f.agencyCoins;
    room.adminCoins = f.adminCoins;
    room.financeMismatch = f.mismatch === true;
    room.lastActivityAt = lastActivity.get(id) || room.startedAt;
  });
  snap.hosts.forEach((h) => {
    const r = snap.rooms.get(h.roomId);
    if (!r) return;
    h.gifts = r.gifts;
    h.giftCoins = r.giftCoins;
    h.hostCoins = r.hostCoins;
    h.agencyCoins = r.agencyCoins;
    h.adminCoins = r.adminCoins;
    h.financeMismatch = r.financeMismatch;
    h.lastActivityAt = r.lastActivityAt;
  });
  const statMap = new Map(userStats.map((r) => [`${toId(r._id.u)}:${toId(r._id.r)}`, r]));
  snap.users.forEach((u, key) => {
    const st = statMap.get(key);
    u.giftsSent = st?.giftsSent || 0;
    u.coinsSpent = round2(st?.coinsSpent);
  });
}

// ---------------------------------------------------------------------------
// reconcile + diff
// ---------------------------------------------------------------------------
let prev = null; // previous snapshot
let latest = null; // last good snapshot (for REST cache)
let running = false;
let pending = false;
let lastRun = 0;
let timer = null;
let inflight = null;

async function reconcile() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  pending = false;
  lastRun = Date.now();
  try {
    const snap = await buildSnapshot();

    try {
      await syncSessions(snap.sessions);
    } catch (e) {
      console.error("[liveAnalytics] session sync failed:", e.message);
    }
    try {
      await attachExtras(snap);
    } catch (e) {
      console.error("[liveAnalytics] extras failed:", e.message);
    }

    snap.counters = computeCounters(snap);
    diffAndEmit(prev, snap);
    prev = snap;
    latest = snap;
  } catch (e) {
    console.error("[liveAnalytics] reconcile failed:", e.message);
  } finally {
    running = false;
    if (pending) markDirty();
  }
}

function diffAndEmit(a, b) {
  if (!a) {
    emitAdmin(EVT.update, { counters: b.counters });
    return; // first run: nothing to diff against
  }

  // rooms
  b.rooms.forEach((room, id) => {
    const old = a.rooms.get(id);
    if (!old) {
      emitAdmin(EVT.roomStarted, { roomId: id, hostId: room.hostId, source: room.source });
      // safety net: the start controller already logged START_ROOM (dedupeKey -> no duplicate)
      recordRoomStart({ roomId: id, hostId: room.hostId, hostName: room.host?.name, source: room.source }).catch(() => {});
      pushActivity({ id: FEED_ID.roomStarted(id), type: "roomStarted", roomId: id, host: hostRef(room), data: { title: room.title } });
    } else if (old.viewers !== room.viewers || old.totalJoined !== room.totalJoined) {
      emitAdmin(EVT.viewerCountUpdated, {
        roomId: id,
        viewers: room.viewers,
        totalJoined: room.totalJoined,
      });
    }
  });
  a.rooms.forEach((room, id) => {
    if (!b.rooms.has(id)) {
      emitAdmin(EVT.roomEnded, { roomId: id, hostId: room.hostId });
      // ended by someone we did not see (host app closed, crash, cron ...): log it ONCE as a system detection
      const detected = () =>
        onRoomEnded({ roomId: id, hostId: room.hostId, hostName: room.host?.name, source: room.source, endedBy: "detected", room }).catch(() => {});
      if (!endingRooms.has(id)) detected();
      else setTimeout(detected, 8000).unref?.(); // the explicit path owns it; this only covers it failing (dedupeKey -> no duplicate)
      scheduleRoomBufferCleanup(id);
    }
  });

  // hosts
  b.hosts.forEach((h, id) => {
    const old = a.hosts.get(id);
    if (!old || old.roomId !== h.roomId) {
      emitAdmin(EVT.hostOnline, { hostId: id, roomId: h.roomId, status: "live" });
    }
  });
  a.hosts.forEach((h, id) => {
    if (!b.hosts.has(id)) emitAdmin(EVT.hostOffline, { hostId: id, roomId: h.roomId });
  });

  // users
  b.users.forEach((u, key) => {
    if (!a.users.has(key)) {
      emitAdmin(EVT.userOnline, {
        userId: u.userId,
        roomId: u.roomId,
        hostId: u.hostId,
        status: "live",
      });
      pushActivity({
        id: FEED_ID.join(u.roomId, u.userId, u.joinedAt),
        type: "join",
        roomId: u.roomId,
        user: userRef(u),
        host: hostRef(b.rooms.get(u.roomId)),
      });
    }
  });
  a.users.forEach((u, key) => {
    if (!b.users.has(key)) {
      emitAdmin(EVT.userOffline, { userId: u.userId, roomId: u.roomId });
      pushActivity({
        id: FEED_ID.leave(u.roomId, u.userId, u.joinedAt),
        type: "leave",
        roomId: u.roomId,
        user: userRef(u),
        host: hostRef(a.rooms.get(u.roomId)),
      });
    }
  });

  if (JSON.stringify(a.counters) !== JSON.stringify(b.counters)) {
    emitAdmin(EVT.update, { counters: b.counters });
  }
}

/** Request a reconcile (throttled). Safe to call from anywhere, never throws. */
function markDirty() {
  if (timer) return;
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRun));
  timer = setTimeout(() => {
    timer = null;
    reconcile();
  }, wait);
}

// ---------------------------------------------------------------------------
// presence (isOnline / isBusy / isLive changes of plain users & hosts)
// ---------------------------------------------------------------------------
const presence = { user: new Set(), host: new Set(), bulk: false };
let presenceTimer = null;

function notePresence(kind, id) {
  if (kind !== "user" && kind !== "host") return;
  if (id) presence[kind].add(toId(id));
  else presence.bulk = true;
  if (presenceTimer) return;
  presenceTimer = setTimeout(() => {
    presenceTimer = null;
    const payload = {
      users: [...presence.user].slice(0, 200),
      hosts: [...presence.host].slice(0, 200),
      many: presence.bulk || presence.user.size > 200 || presence.host.size > 200,
    };
    presence.user.clear();
    presence.host.clear();
    presence.bulk = false;
    emitAdmin(EVT.presence, payload);
  }, 1000);
}

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------
/** Cached fresh snapshot for the REST layer (deduped, ~1.5s TTL). */
async function getSnapshot() {
  if (latest && Date.now() - latest.builtAt < SNAPSHOT_TTL_MS) return latest;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const snap = await buildSnapshot();
      await attachExtras(snap);
      snap.counters = computeCounters(snap);
      return snap;
    } finally {
      inflight = null;
    }
  })();
  const snap = await inflight;
  latest = latest && latest.builtAt > snap.builtAt ? latest : snap;
  return snap;
}

// ---------------------------------------------------------------------------
// admin socket
// ---------------------------------------------------------------------------
const isAdminHandshake = (socket) => {
  const a = socket.handshake?.auth || {};
  return !a.loginUserId && !!a.token;
};

async function authenticateAdminSocket(socket) {
  try {
    const { token, key } = socket.handshake.auth || {};
    if (!token || !key || key !== process.env.secretKey) {
      console.warn("[liveAnalytics] admin socket: missing token / wrong key");
      return false;
    }
    const firebase = require("../util/privateKey");
    const decoded = await firebase.auth.verifyIdToken(token);
    if (!decoded?.uid) return false;
    const admin = await Admin.findOne({ uid: decoded.uid }).select("_id").lean();
    if (!admin) console.warn("[liveAnalytics] admin socket: no Admin with uid", decoded.uid);
    return !!admin;
  } catch (e) {
    // most common reason: Firebase ID token expired (1h) - the panel refreshes it and reconnects
    console.warn("[liveAnalytics] admin socket auth failed:", e.code || e.message);
    return false;
  }
}

function registerAdminSocket(socket) {
  const authPromise = authenticateAdminSocket(socket);

  // reject quickly if auth fails (no admin room, no data)
  authPromise.then((ok) => {
    if (!ok) {
      console.warn("[liveAnalytics] admin socket rejected:", socket.id);
      socket.emit("liveAnalytics:authError", { message: "Realtime authentication failed. Refreshing session…" });
      setTimeout(() => socket.disconnect(true), 100);
    }
  });

  socket.on("liveAnalytics:subscribe", async () => {
    if (!(await authPromise)) return;
    socket.join(ADMIN_ROOM);
    const snap = latest || (await getSnapshot().catch(() => null));
    if (snap) socket.emit(EVT.update, { counters: snap.counters });
  });

  socket.on("liveAnalytics:unsubscribe", () => {
    socket.leave(ADMIN_ROOM);
  });
}

// ---------------------------------------------------------------------------
// activity feed (comments / gifts / joins / leaves / room events)
//   - kept in memory only (ring buffers), NOT written to the database
//   - emitted to admins in small batches (250 ms) to stay light under load
// ---------------------------------------------------------------------------
const ACTIVITY_MAX = 500;
const ROOM_COMMENTS_MAX = 300;
const ROOM_GIFTS_MAX = 200;

const activityBuf = [];
const roomBuf = new Map(); // roomId -> { comments: [], gifts: [] }
const lastActivity = new Map(); // roomId -> ISO string
let activitySeq = 0;
let activityQueue = [];
let activityTimer = null;

const userRef = (u) =>
  u ? { userId: u.userId, name: u.name || "", image: u.image || "", uniqueId: u.uniqueId || "" } : null;

const hostRef = (r) =>
  r && r.host
    ? {
        hostId: r.hostId,
        name: r.host.name || "",
        image: r.host.image || "",
        uniqueId: r.host.uniqueId || "",
      }
    : null;

function getRoomBuf(roomId) {
  let b = roomBuf.get(roomId);
  if (!b) {
    b = { comments: [], gifts: [] };
    roomBuf.set(roomId, b);
  }
  return b;
}

function scheduleRoomBufferCleanup(roomId) {
  // keep the last comments / gifts visible for 10 minutes after the room ended
  setTimeout(() => {
    roomBuf.delete(roomId);
    lastActivity.delete(roomId);
  }, 10 * 60 * 1000).unref?.();
}

/** deterministic feed ids: REST history and realtime socket entries share them (no duplicates) */
const FEED_ID = {
  join: (roomId, userId, joinedAt) => `j:${roomId}:${userId}:${+new Date(joinedAt)}`,
  leave: (roomId, userId, joinedAt) => `l:${roomId}:${userId}:${+new Date(joinedAt)}`,
  roomStarted: (roomId) => `rs:${roomId}`,
  roomEnded: (roomId) => `re:${roomId}`,
};

// ---------------------------------------------------------------------------
// uniform event shape: every entry (socket + REST) carries
//   eventId, roomId, eventType, actorId, actorName, timestamp, message (+ payload in `data`)
// ---------------------------------------------------------------------------
const EVENT_CODE = {
  comment: "COMMENT",
  gift: "GIFT",
  join: "JOIN",
  leave: "LEAVE",
  roomStarted: "ROOM_START",
  roomEnded: "ROOM_END",
};

function buildMessage(e) {
  const u = e.user?.name || "User";
  const h = e.host?.name || "Host";
  const d = e.data || {};
  switch (e.type) {
    case "comment":
      return `${u} commented: ${d.text || ""}`;
    case "gift":
      return `${u} sent ${d.giftName || "Gift"} x${d.quantity || 1}`;
    case "join":
      return `${u} joined the room`;
    case "leave":
      return `${u} left the room`;
    case "roomStarted":
      return `Host ${h} started the live room`;
    case "roomEnded":
      return d.actorType === "admin"
        ? `Admin ${d.actorName || ""} ended the live room`.replace("  ", " ")
        : `Host ${h} ended the live room`;
    default:
      return String(e.type || "");
  }
}

function decorateFields(e) {
  const room = e.type === "roomStarted" || e.type === "roomEnded";
  return {
    eventId: e.id,
    eventType: EVENT_CODE[e.type] || String(e.type || "").toUpperCase(),
    actorId: room ? e.host?.hostId || "" : e.user?.userId || "",
    actorName: room ? e.data?.actorName || e.host?.name || "" : e.user?.name || "",
    timestamp: e.at,
    message: buildMessage(e),
  };
}

/** plain REST entry -> same shape as a realtime entry */
const decorate = (e) => ({ ...e, ...decorateFields(e) });

function pushActivity(entry) {
  const full = {
    id: `${Date.now().toString(36)}-${(activitySeq++).toString(36)}`,
    at: new Date().toISOString(),
    user: null,
    host: null,
    data: {},
    ...entry,
  };

  Object.assign(full, decorateFields(full));
  activityBuf.push(full);
  if (activityBuf.length > ACTIVITY_MAX) activityBuf.splice(0, activityBuf.length - ACTIVITY_MAX);

  if (full.roomId) {
    lastActivity.set(full.roomId, full.at);
    if (full.type === "comment" || full.type === "gift") {
      const b = getRoomBuf(full.roomId);
      const list = full.type === "comment" ? b.comments : b.gifts;
      const max = full.type === "comment" ? ROOM_COMMENTS_MAX : ROOM_GIFTS_MAX;
      list.push(full);
      if (list.length > max) list.splice(0, list.length - max);
    }
  }

  activityQueue.push(full);
  if (!activityTimer) {
    activityTimer = setTimeout(() => {
      activityTimer = null;
      const entries = activityQueue;
      activityQueue = [];
      if (entries.length) emitAdmin(EVT.activity, { entries });
    }, 250);
  }
  return full;
}

const PROFILE_TTL_MS = 60 * 1000;
const profileCache = new Map(); // `${kind}:${id}` -> { at, v }

/** host / user profile snapshot for the feed - works even after the room ended (cached 60 s) */
async function lookupProfile(kind, id) {
  try {
    if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
    const key = `${kind}:${id}`;
    const hit = profileCache.get(key);
    if (hit && Date.now() - hit.at < PROFILE_TTL_MS) return hit.v;
    const Model = kind === "host" ? Host : User;
    const d = await Model.findById(id).select("name image uniqueId").lean();
    if (!d) return null;
    const base = { name: d.name || "", image: imgUrl(d.image), uniqueId: d.uniqueId || "" };
    const v = kind === "host" ? { hostId: toId(d._id), ...base } : { userId: toId(d._id), ...base };
    if (profileCache.size > 2000) profileCache.clear();
    profileCache.set(key, { at: Date.now(), v });
    return v;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ROOM ID RESOLUTION
//   Comments and gifts are only visible in the Command Center when they carry the SAME room id
//   (LiveBroadcastHistory _id) as the room. The app payload is not always complete / current, so
//   the server resolves the room itself instead of trusting the client blindly.
//   trust "payload" (comments): a valid id in the payload wins.
//   trust "host"    (gifts)   : the receiving host's ACTIVE live room wins (it is the money room).
// ---------------------------------------------------------------------------
const validId = (v) => !!v && mongoose.Types.ObjectId.isValid(String(v));

async function resolveRoomId({ liveHistoryId, hostId, userId, socket, trust = "payload" } = {}) {
  const payload = validId(liveHistoryId) ? toId(liveHistoryId) : "";
  try {
    if (trust === "payload" && payload) return payload;
    if (validId(hostId)) {
      if (payload && (await LiveBroadcaster.exists({ liveHistoryId: payload, hostId }))) return payload;
      const b = await LiveBroadcaster.findOne({ hostId }).select("liveHistoryId").lean();
      if (b?.liveHistoryId) return toId(b.liveHistoryId);
    }
    if (payload) return payload;
    if (validId(userId)) {
      const v = await LiveBroadcastView.findOne({ userId }).sort({ createdAt: -1 }).select("liveHistoryId").lean();
      if (v?.liveHistoryId) return toId(v.liveHistoryId);
    }
    const fromSocket = socket?.data?.liveHistoryId;
    if (validId(fromSocket)) return toId(fromSocket);
  } catch (e) {
    console.error("[liveAnalytics] resolveRoomId:", e.message);
  }
  return payload;
}

/** called from socket.js (liveCommentBroadcast). Never throws, never awaited. */
async function notifyComment({ liveHistoryId, userId, userName, userImage, commentText, isSystemMessage, feedId: givenFeedId, isHostMessage }) {
  try {
    if (isSystemMessage || !liveHistoryId || !commentText) return;
    const roomId = toId(liveHistoryId);
    const room = (latest && latest.rooms.get(roomId)) || (prev && prev.rooms.get(roomId)) || null;
    const text = String(commentText).slice(0, 500);

    // sender profile (User first, Host when the host comments) -> same ids as participants / gifts
    const profile = (await lookupProfile("user", userId)) || (await lookupProfile("host", userId));
    const name = profile?.name || userName || "";
    const image = profile?.image || (isHttp(userImage) ? userImage : imgUrl(userImage));
    const uniqueId = profile?.uniqueId || "";

    // realtime id == database id -> REST + socket never duplicate (the live chat passes its messageId)
    const _id = givenFeedId && mongoose.Types.ObjectId.isValid(givenFeedId) ? new mongoose.Types.ObjectId(givenFeedId) : new mongoose.Types.ObjectId();
    const feedId = String(_id);
    const at = new Date();

    let persisted = false;
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      try {
        await LiveComment.create({ _id, feedId, roomId, userId: toId(userId), uniqueId, name, image, text, isHostMessage: isHostMessage === true, createdAt: at });
        persisted = true;
      } catch (e) {
        console.error("[liveAnalytics] comment persist failed:", e.message);
      }
    }

    pushActivity({
      id: feedId,
      at: at.toISOString(),
      type: "comment",
      roomId,
      user: { userId: toId(userId), name, image, uniqueId },
      host: hostRef(room),
      data: { text, persisted },
    });
  } catch (e) {
    console.error("[liveAnalytics] notifyComment:", e.message);
  }
}

// ---- finance push (backend authoritative, throttled) ----
const financeRooms = new Set();
let financeTimer = null;

function scheduleFinance(roomId) {
  if (roomId) financeRooms.add(toId(roomId));
  if (financeTimer) return;
  financeTimer = setTimeout(async () => {
    financeTimer = null;
    const ids = [...financeRooms];
    financeRooms.clear();
    try {
      const [today, rooms] = await Promise.all([todayTotals(), roomFinanceMap(ids)]);
      // keep REST cache honest: the next /live-rooms call must not return pre-gift numbers
      latest = null;
      const roomsOut = {};
      ids.forEach((id) => {
        const f = rooms.get(id) || { ...EMPTY_FINANCE, uniqueSenders: 0 };
        roomsOut[id] = {
          gifts: f.gifts,
          giftCoins: f.grossCoins,
          hostCoins: f.hostCoins,
          agencyCoins: f.agencyCoins,
          adminCoins: f.adminCoins,
          financeMismatch: f.mismatch === true,
          transactions: f.transactions || 0,
          uniqueSenders: f.uniqueSenders || 0,
        };
      });
      emitAdmin(EVT.earnings, { today, rooms: roomsOut });
    } catch (e) {
      console.error("[liveAnalytics] finance push failed:", e.message);
    }
  }, 700);
}

/** called from socket.js (liveGiftSent) AFTER History was saved. Never throws, never awaited. */
async function notifyGift(g) {
  const roomId = g.liveHistoryId ? toId(g.liveHistoryId) : "";
  // money totals first: they only depend on the History row that is already saved,
  // so the cards / room revenue update even if a profile lookup below fails.
  scheduleFinance(roomId);
  try {
    const [sender, host, gift] = await Promise.all([
      lookupProfile("user", g.senderId),
      lookupProfile("host", g.hostId),
      Gift.findById(g.giftId).select("coin name imageUrl imageKey").lean(),
    ]);

    pushActivity({
      id: toId(g.historyId), // same id as the REST row -> the admin never shows a gift twice
      type: "gift",
      roomId,
      user: sender || { userId: toId(g.senderId), name: "", image: "", uniqueId: "" },
      host: host || { hostId: toId(g.hostId), name: "", image: "", uniqueId: "" },
      data: {
        transactionId: toId(g.historyId),
        uniqueId: g.uniqueId || "",
        giftId: toId(g.giftId),
        giftName: gift?.name || "",
        giftImage: imgUrl(gift?.imageUrl || gift?.imageKey || ""),
        giftCoin: g.giftCoin,
        quantity: g.giftCount,
        grossCoins: g.totalCoin,
        hostCoins: g.hostCoin,
        agencyCoins: g.agencyCoin,
        adminCoins: g.adminCoin,
      },
    });
  } catch (e) {
    console.error("[liveAnalytics] notifyGift:", e.message);
  }
}

// ---------------------------------------------------------------------------
// audit log  (admin actions AND host room lifecycle)
// ---------------------------------------------------------------------------
const actorOfAdmin = (admin) => ({
  actorType: "admin",
  actorId: toId(admin?._id),
  actorName: admin?.email || admin?.name || "Admin",
});

/**
 * @returns {Promise<"created"|"duplicate"|"error">}
 * With `dedupeKey` the write is idempotent (unique partial index + upsert): retries, the host
 * socket event and the reconcile safety net can all report the same action - only ONE row exists.
 */
async function writeAudit({ admin, actor, action, targetType, targetId, roomId, status = "success", reason = "", dedupeKey, metadata = {} }) {
  try {
    const a = actor || (admin ? actorOfAdmin(admin) : { actorType: "system", actorId: "", actorName: "System" });
    const doc = {
      adminId: a.actorType === "admin" ? admin?._id || null : null,
      adminEmail: a.actorType === "admin" ? admin?.email || a.actorName : "",
      actorType: a.actorType,
      actorId: a.actorId || "",
      actorName: a.actorName || "",
      reason: reason || "",
      action,
      targetType,
      targetId: toId(targetId),
      roomId: toId(roomId),
      status,
      metadata,
    };
    if (dedupeKey) {
      const r = await LiveAdminAudit.updateOne({ dedupeKey }, { $setOnInsert: { ...doc, dedupeKey } }, { upsert: true });
      if (r.upsertedCount > 0) {
        emitAdmin(EVT.audit, { action, roomId: doc.roomId });
        return "created";
      }
      return "duplicate";
    }
    await LiveAdminAudit.create(doc);
    emitAdmin(EVT.audit, { action, roomId: doc.roomId });
    return "created";
  } catch (e) {
    if (e && e.code === 11000) return "duplicate";
    console.error("[liveAnalytics] audit write failed:", e.message);
    return "error";
  }
}

// ---------------------------------------------------------------------------
// room lifecycle (START_ROOM / END_ROOM) - single entry points for every code path
// ---------------------------------------------------------------------------
const endingRooms = new Set(); // rooms an END is currently running for (blocks duplicate ends)
const endedPushed = new Set(); // rooms whose ROOM_END feed entry was already pushed

/** drop the REST snapshot cache so the next read reflects the change immediately */
const invalidateSnapshot = () => {
  latest = null;
};

/** an explicit end path (host socket / disconnect) announces itself BEFORE touching the DB */
function markEnding(roomId) {
  const id = toId(roomId);
  if (!id) return;
  endingRooms.add(id);
  setTimeout(() => endingRooms.delete(id), 20 * 1000).unref?.();
}

/** HOST (or the reconcile safety net) started a room -> START_ROOM audit, once per room */
async function recordRoomStart({ roomId, hostId, hostName, source = "broadcast", actor }) {
  const id = toId(roomId);
  if (!id) return "error";
  return writeAudit({
    actor: actor || { actorType: "host", actorId: toId(hostId), actorName: hostName || "Host" },
    action: "START_ROOM",
    targetType: "room",
    targetId: id,
    roomId: id,
    dedupeKey: `START_ROOM:${id}`,
    metadata: { hostId: toId(hostId), source },
  });
}

/** close every still-open participant session of a room NOW (final durations) */
async function finalizeRoomSessions(roomId) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) return;
  const now = new Date();
  await LiveSession.collection.updateMany(
    { roomId: new mongoose.Types.ObjectId(roomId), leftAt: null },
    [
      {
        $set: {
          leftAt: now,
          updatedAt: now,
          duration: { $max: [0, { $round: [{ $divide: [{ $subtract: [now, "$joinedAt"] }, 1000] }, 0] }] },
        },
      },
    ]
  );
}

function pushRoomEndedOnce(roomId, room, data = {}) {
  if (endedPushed.has(roomId)) return;
  endedPushed.add(roomId);
  setTimeout(() => endedPushed.delete(roomId), 10 * 60 * 1000).unref?.();
  pushActivity({
    id: FEED_ID.roomEnded(roomId),
    type: "roomEnded",
    roomId,
    host: hostRef(room),
    data: { title: room?.title || "", ...data },
  });
}

/**
 * ANY path that ended a room (host socket, host disconnect, admin, detected by reconcile) calls this:
 *   1. participant durations finalized   2. END_ROOM audit (idempotent)
 *   3. ROOM_END feed entry (once)        4. final revenue pushed, caches dropped
 */
async function onRoomEnded({ roomId, hostId, hostName, source = "broadcast", actor, endedBy = "host", reason = "", room }) {
  const id = toId(roomId);
  if (!id) return;
  const row = room || (latest && latest.rooms.get(id)) || (prev && prev.rooms.get(id)) || null;
  const name = hostName || row?.host?.name || "Host";
  const who = actor || (endedBy === "detected" ? { actorType: "system", actorId: "", actorName: "System" } : { actorType: "host", actorId: toId(hostId), actorName: name });
  try {
    await finalizeRoomSessions(id);
  } catch (e) {
    console.error("[liveAnalytics] finalize sessions:", e.message);
  }
  const res = await writeAudit({
    actor: who,
    action: "END_ROOM",
    targetType: "room",
    targetId: id,
    roomId: id,
    reason,
    dedupeKey: `END_ROOM:${id}`,
    metadata: { endedBy, source, hostId: toId(hostId) },
  });
  if (res === "created") pushRoomEndedOnce(id, row, { actorType: who.actorType, actorName: who.actorName, endedBy, reason });
  scheduleFinance(id);
  invalidateSnapshot();
  markDirty();
}

// ---------------------------------------------------------------------------
// admin action: end a live room
// ---------------------------------------------------------------------------
/**
 * Mirrors what the app flows already do (socket `liveStreamEnd` for broadcasts,
 * `room:end` for party rooms) so every client gets the SAME events it already handles.
 * Permission is checked by the controller BEFORE this is called.
 * @returns {{ok:boolean, status?:number, message?:string, data?:Object}}
 */
async function endRoom(roomId, admin, reason = "") {
  const rid = String(roomId);
  if (endingRooms.has(rid)) return { ok: false, status: 409, message: "This room is already being ended." };
  endingRooms.add(rid);
  try {
    invalidateSnapshot();
    const snap = await getSnapshot();
    const room = snap.rooms.get(rid);
    const meta = { reason, source: room?.source || null, hostId: room?.hostId || null };
    const actor = actorOfAdmin(admin);

    if (!room) {
      // already ended: do NOT write another row if the END is already on record (retry safe)
      const done = await LiveAdminAudit.exists({ dedupeKey: `END_ROOM:${rid}` });
      if (!done) {
        await writeAudit({ admin, actor, action: "END_ROOM", targetType: "room", targetId: rid, roomId: rid, status: "failed", reason, dedupeKey: `END_ROOM_FAILED:${rid}:${actor.actorId}`, metadata: { ...meta, error: "not live" } });
      }
      return { ok: false, status: 409, message: "Room is not live (already ended)." };
    }

    const io = getIo();
    const endedAt = new Date();
    try {
      if (room.source === "broadcast") {
        // ONE atomic, idempotent close shared with host-end / disconnect / reaper (liveSession.service):
        // endTime + duration from SERVER time, host reset, viewers / broadcaster removed,
        // Daily LIVE Task recalculated (an admin-ended live still counts for the host's task).
        const fin = await require("./liveSession.service").finalizeLiveSession({
          hostId: null, // admin override: no host-ownership check
          historyId: rid,
          reason: "admin-end",
          analytics: false, // announced below with the ADMIN as actor
        });
        if (fin.notFound) return { ok: false, status: 404, message: "Live session not found." };
        if (!fin.finalized) return { ok: false, status: 409, message: "Room already ended." };

        io.in(rid).emit("liveStreamEnd", { hostId: room.hostId, liveHistoryId: rid, endedBy: "admin" });
        io.socketsLeave(rid);
      } else {
        const doc = await Room.findById(rid);
        if (!doc || doc.status === "ended") {
          return { ok: false, status: 409, message: "Room already ended." };
        }
        doc.status = "ended";
        doc.endedAt = endedAt;
        await doc.save();

        const channel = `room:${rid}`;
        io.to(channel).emit("room:ended", { roomId: rid, hostId: doc.hostId, message: "Room has been ended by admin" });
        await Participant.updateMany(
          { roomId: rid },
          {
            $set: {
              isActive: false,
              leftAt: endedAt,
              socketId: null,
              seatIndex: null,
              role: "audience",
              isHandRaised: false,
              requestedSeatIndex: null,
              isMuted: false,
              micEnabled: false,
            },
          }
        );
        const sockets = await io.in(channel).fetchSockets();
        sockets.forEach((sk) => sk.leave(channel));
        io.to(channel).emit("room:viewer-count", { roomId: rid, count: 0 });
      }

      // finalize: durations, END_ROOM audit (idempotent), ROOM_END feed entry, final revenue push
      await onRoomEnded({ roomId: rid, hostId: room.hostId, hostName: room.host?.name, source: room.source, actor, endedBy: "admin", reason, room });
      return { ok: true, data: { roomId: rid, status: "ended", endedAt: endedAt.toISOString() } };
    } catch (e) {
      console.error("[liveAnalytics] endRoom failed:", e);
      await writeAudit({ admin, actor, action: "END_ROOM", targetType: "room", targetId: rid, roomId: rid, status: "failed", reason, dedupeKey: `END_ROOM_FAILED:${rid}:${actor.actorId}:error`, metadata: { ...meta, error: e.message } });
      return { ok: false, status: 500, message: "Failed to end the room." };
    }
  } finally {
    endingRooms.delete(rid);
  }
}

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------
let started = false;
function start() {
  if (started) return;
  started = true;
  setTimeout(() => markDirty(), 3000).unref?.();
  setInterval(() => markDirty(), SAFETY_TICK_MS).unref?.();
  console.log("✅ Live analytics engine started");
}

module.exports = {
  ADMIN_ROOM,
  EVT,
  start,
  markDirty,
  notePresence,
  getSnapshot,
  isAdminHandshake,
  registerAdminSocket,
  imgUrl,
  notifyComment,
  notifyGift,
  endRoom,
  writeAudit,
  resolveRoomId,
  markEnding,
  recordRoomStart,
  onRoomEnded,
  decorate,
  invalidateSnapshot,
  FEED_ID,
  getActivity: () => activityBuf,
  getRoomBuffers: (roomId) => roomBuf.get(String(roomId)) || { comments: [], gifts: [] },
  todayTotals,
  roomFinanceMap,
  FINANCE_GROUP,
  cleanFinance,
  HISTORY_GIFT_IN_LIVE,
};
