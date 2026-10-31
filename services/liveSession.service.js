/**
 * Live session lifecycle (single place that ENDS a live session).
 *
 *   START (HostStreaming)  ->  ACTIVE (Host.isLive, history.endTime "")
 *   liveHeartbeat          ->  history.lastHeartbeatAt
 *   END / EXIT / DISCONNECT / HTTP end / stale reaper  ->  finalizeLiveSession()  ->  ENDED
 *
 * finalizeLiveSession is ATOMIC + IDEMPOTENT: the history is closed with
 * findOneAndUpdate({ endTime: empty }), so only ONE caller wins, the duration is computed once
 * from SERVER timestamps, and a second "End Live", a concurrent disconnect, the reaper... can
 * never overwrite endTime/duration (which would inflate minutes).
 *
 * LiveBroadcastHistory stays the source of truth for duration; the Daily Task service derives
 * progress from it and is refreshed after every finalize.
 */
const moment = require("moment-timezone");

const Host = require("../models/host.model");
const LiveBroadcastHistory = require("../models/liveBroadcastHistory.model");
const LiveBroadcaster = require("../models/liveBroadcaster.model");
const LiveBroadcastView = require("../models/liveBroadcastView.model");
const { hostRoom } = require("../config/dailyTask.config");

const TIMEZONE = "Asia/Kolkata";

// endTime is stored as a string; an open session has "" (or null / missing on old docs)
const OPEN_SESSION = [{ endTime: "" }, { endTime: null }, { endTime: { $exists: false } }];

const envSeconds = (name, fallback) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

// no heartbeat / socket for this long => the session is considered dead
const getStaleMs = () => envSeconds("LIVE_STALE_SECONDS", 120) * 1000;
// the host app's SOCKET is still connected (verified by socket.io ping/pong) but its heartbeat went quiet
// (timer paused in the background, app bug): do NOT end a live that is demonstrably connected. Only after
// this much longer silence is the session treated as dead.
const getStaleWithSocketMs = () => Math.max(envSeconds("LIVE_STALE_WITH_SOCKET_SECONDS", 900) * 1000, getStaleMs());
const REAPER_INTERVAL_MS = 60 * 1000;

const pad2 = (n) => String(n).padStart(2, "0");
const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
};

const log = (tag, data) => console.log(`[${tag}]`, JSON.stringify(data));

// ---------------------------------------------------------------------------
// Admin Live Command Center bridge (observe-only, can never break the end flow).
// Every path that closes a live session goes through finalizeLiveSession(), so this is the ONE place
// that announces the end to the Command Center: END_ROOM audit (idempotent), ROOM_END event,
// final participant durations + final revenue push.
// ---------------------------------------------------------------------------
const getAnalytics = () => {
  try {
    return require("./liveAnalytics.service");
  } catch (err) {
    return null;
  }
};

// who ended it, derived from the technical reason (callers may override with `actor`)
const ENDED_BY = {
  liveStreamEnd: { endedBy: "host" },
  "http-end": { endedBy: "host" },
  "socket-disconnect": { endedBy: "host_disconnected" },
  "stale-timeout": { endedBy: "stale_timeout", system: true, text: "No heartbeat from the host app" },
  "new-live-start": { endedBy: "superseded", system: true, text: "Previous session closed by a new live start" },
};

const announceEndToCommandCenter = async ({ historyId, hostId, reason, actor, endedBy, text }) => {
  const analytics = getAnalytics();
  if (!analytics) return;
  const map = ENDED_BY[reason] || {};
  let hostName = "";
  try {
    const h = await Host.findById(hostId).select("name").lean();
    hostName = h?.name || "";
  } catch (_) {
    /* name is optional */
  }
  await analytics.onRoomEnded({
    roomId: historyId,
    hostId,
    hostName,
    source: "broadcast",
    actor: actor || (map.system ? { actorType: "system", actorId: "", actorName: "System" } : undefined),
    endedBy: endedBy || map.endedBy || String(reason || "host"),
    reason: text || map.text || "",
  });
};

const refreshDailyTask = (hostId, source) => {
  try {
    require("./dailyTask.service").triggerRefresh(hostId, source);
  } catch (err) {
    console.error(`[LIVE_END] daily task refresh failed: ${err.message}`);
  }
};

const notifyHostStatus = (hostId) => {
  try {
    if (typeof global.emitHostStatusUpdate === "function") global.emitHostStatusUpdate(hostId);
  } catch (err) {
    console.error(`[LIVE_END] host status emit failed: ${err.message}`);
  }
};

/**
 * Close a live session exactly once.
 * @returns {{ finalized:boolean, alreadyEnded?:boolean, notFound?:boolean, hostId?:any, durationSeconds?:number }}
 */
const finalizeLiveSession = async ({
  hostId = null,
  historyId,
  endedAtMs = Date.now(),
  reason = "manual",
  // Command Center: pass `analytics:false` when the caller announces the end itself (admin end-room)
  analytics = true,
  actor,
  endedBy,
  reasonText,
}) => {
  if (!historyId) return { finalized: false, notFound: true };

  const history = await LiveBroadcastHistory.findById(historyId).select("hostId startTime endTime").lean();
  if (!history) {
    log("LIVE_END", { historyId: String(historyId), result: "history_not_found", reason });
    return { finalized: false, notFound: true };
  }

  // a host can only end its own session
  if (hostId && history.hostId && String(history.hostId) !== String(hostId)) {
    log("LIVE_END", { historyId: String(historyId), result: "not_owner", reason });
    return { finalized: false, notOwner: true };
  }

  const hid = history.hostId;
  const startMs = Date.parse(history.startTime);
  let endMs = Math.min(Number(endedAtMs) || Date.now(), Date.now());
  if (Number.isFinite(startMs) && endMs < startMs) endMs = startMs;
  const durationSeconds = Number.isFinite(startMs) ? Math.floor((endMs - startMs) / 1000) : 0;
  const endTime = moment(endMs).tz(TIMEZONE).format();

  // tell the Command Center an explicit end is running (so its safety net does not log it as "detected")
  if (analytics) {
    try {
      getAnalytics()?.markEnding(history._id);
    } catch (_) {
      /* observe only */
    }
  }

  // ---- the atomic gate: only the caller that closes the open session continues as "finalized"
  const closed = await LiveBroadcastHistory.findOneAndUpdate(
    { _id: history._id, $or: OPEN_SESSION },
    { $set: { endTime, duration: formatDuration(durationSeconds), endReason: reason } },
    { new: true }
  ).lean();

  // ---- cleanup is idempotent and always safe (also repairs half-finished earlier attempts)
  await Promise.all([
    // conditional: never clobbers a NEWER session of the same host
    Host.updateOne(
      { _id: hid, liveHistoryId: history._id },
      { $set: { isLive: false, isBusy: false, liveHistoryId: null } }
    ),
    LiveBroadcastView.deleteMany({ liveHistoryId: history._id }),
    LiveBroadcaster.deleteOne({ hostId: hid, liveHistoryId: history._id }),
  ]);

  // the "host joined" system message may be announced again for a future session
  try {
    if (global.hostJoinAnnounced) global.hostJoinAnnounced.delete(String(history._id));
  } catch (_) {
    /* best effort */
  }

  if (!closed) {
    log("LIVE_END", { hostId: String(hid), sessionId: String(history._id), result: "already_ended", reason });
    return { finalized: false, alreadyEnded: true, hostId: hid };
  }

  log("LIVE_END", {
    hostId: String(hid),
    sessionId: String(history._id),
    endedAt: endTime,
    durationMinutes: Math.floor(durationSeconds / 60),
    durationSeconds,
    reason,
  });

  // viewers: EVERY end path (host button, HTTP, disconnect, stale reaper, admin, new start) tells the
  // whole room, then the room is emptied so nobody stays in a dead live. liveStreamEnd is idempotent
  // on the app side, so a second emit is harmless.
  try {
    if (global.io) {
      const roomId = String(history._id);
      const endPayload = JSON.stringify({ hostId: String(hid), liveHistoryId: roomId, reason, endedAt: endTime });
      global.io.in(roomId).emit("liveStreamEnd", endPayload);
      // the host's other devices / a host socket that was not in the room (reconnect) learn it too
      // (excluding the room = exactly one delivery per socket)
      global.io.in(`globalRoom:${String(hid)}`).except(roomId).emit("liveStreamEnd", endPayload);
      // let the emit flush, then drop every socket from the room and clear the chat replay buffer
      setTimeout(() => {
        try {
          global.io.socketsLeave(roomId);
          require("./liveRoom.service").clearRoomState(roomId);
        } catch (_) {
          /* best effort */
        }
      }, 2000).unref?.();
    }
  } catch (_) {
    /* best effort */
  }

  // Daily Task: recalculate from history (+ reward, + socket) and refresh host lists
  refreshDailyTask(hid, `live-end:${reason}`);
  notifyHostStatus(hid);

  // Command Center: END_ROOM audit + ROOM_END event + final durations / revenue (fire-and-forget)
  if (analytics) {
    announceEndToCommandCenter({ historyId: history._id, hostId: hid, reason, actor, endedBy, text: reasonText }).catch((err) =>
      console.error(`[LIVE_END] command center announce failed: ${err.message}`)
    );
  }

  return { finalized: true, hostId: hid, durationSeconds };
};

/**
 * Close every still-open session of a host using its LAST KNOWN proof of life
 * (heartbeat, else last write). Conservative on purpose: never grants minutes for time the
 * host was not demonstrably live.
 */
const finalizeOpenSessionsForHost = async (hostId, reason = "superseded") => {
  const rows = await LiveBroadcastHistory.find({ hostId, $or: OPEN_SESSION })
    .select("_id startTime lastHeartbeatAt updatedAt")
    .lean();

  let count = 0;
  for (const row of rows) {
    const lastSeen = row.lastHeartbeatAt || row.updatedAt || row.startTime;
    const r = await finalizeLiveSession({
      hostId,
      historyId: row._id,
      endedAtMs: new Date(lastSeen).getTime(),
      reason,
    });
    if (r.finalized) count += 1;
  }
  return count;
};

// ---------------------------------------------------------------------------
// One ACTIVE live per host (server-side guard, never trust the client)
// ---------------------------------------------------------------------------
// A session counts as ACTIVE (and blocks a second start) while it has proof of life this recent.
// Older than that = the previous app instance is gone -> the new start supersedes it.
const getStartGuardMs = () => envSeconds("LIVE_START_GUARD_SECONDS", 45) * 1000;

/**
 * @returns {{ active:boolean, liveHistoryId?:string }}
 *  active=true  -> the host really is live right now (heartbeat / creation younger than the guard window)
 *  active=false -> no session, or a dead one (the caller finalizes it and continues)
 */
const checkActiveSession = async (hostId) => {
  const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();
  if (!host || !host.isLive || !host.liveHistoryId) return { active: false };

  const history = await LiveBroadcastHistory.findById(host.liveHistoryId)
    .select("endTime lastHeartbeatAt createdAt")
    .lean();
  if (!history || (history.endTime && history.endTime !== "")) return { active: false };

  const lastSeen = Math.max(
    history.lastHeartbeatAt ? new Date(history.lastHeartbeatAt).getTime() : 0,
    history.createdAt ? new Date(history.createdAt).getTime() : 0
  );
  const alive = Date.now() - lastSeen < getStartGuardMs();
  return alive ? { active: true, liveHistoryId: String(host.liveHistoryId) } : { active: false };
};

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------
const lastHeartbeatWrite = new Map();

/**
 * Host app proof-of-life (every ~20s). Writes at most every 10s per host.
 * hostId MUST come from the authenticated socket, never from the payload.
 */
const recordHeartbeat = async (hostId) => {
  if (!hostId) return { isLive: false };
  const key = String(hostId);

  const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();
  if (!host || !host.isLive || !host.liveHistoryId) return { isLive: false };

  const now = Date.now();
  if (now - (lastHeartbeatWrite.get(key) || 0) >= 10 * 1000) {
    lastHeartbeatWrite.set(key, now);
    await LiveBroadcastHistory.updateOne(
      { _id: host.liveHistoryId, $or: OPEN_SESSION },
      { $set: { lastHeartbeatAt: new Date(now) } }
    );
    log("LIVE_HEARTBEAT", { hostId: key, sessionId: String(host.liveHistoryId) });
  }

  return { isLive: true, liveHistoryId: String(host.liveHistoryId), serverTime: new Date(now).toISOString() };
};

// ---------------------------------------------------------------------------
// Stale-session reaper (app killed, internet lost, server restart, missed disconnect)
// ---------------------------------------------------------------------------
const offlineSince = new Map();

const hostHasSocket = (hostId) => {
  try {
    if (!global.io || !global.io.sockets || !global.io.sockets.adapter) return null; // unknown
    const room = global.io.sockets.adapter.rooms.get(hostRoom(hostId));
    return Boolean(room && room.size > 0);
  } catch (_) {
    return null;
  }
};

const resetHostIfStillPointing = (hostId, historyId) =>
  Host.updateOne(
    { _id: hostId, liveHistoryId: historyId },
    { $set: { isLive: false, isBusy: false, liveHistoryId: null } }
  );

/**
 * One pass over hosts flagged live.
 *  - heartbeat-aware session (new app): stale when no heartbeat for LIVE_STALE_SECONDS.
 *  - old app without heartbeat: stale only when the host has had NO socket for LIVE_STALE_SECONDS.
 * A stale session ends at its last proof of life, so no minutes are invented.
 */
const reapStaleSessions = async () => {
  const now = Date.now();
  const staleMs = getStaleMs();
  let reaped = 0;

  const hosts = await Host.find({ isLive: true }).select("_id liveHistoryId").lean();
  const liveIds = new Set(hosts.map((h) => String(h._id)));
  for (const id of offlineSince.keys()) if (!liveIds.has(id)) offlineSince.delete(id);

  for (const host of hosts) {
    const key = String(host._id);
    try {
      // flagged live but no session pointer -> just repair the flag
      if (!host.liveHistoryId) {
        await Host.updateOne({ _id: host._id, liveHistoryId: null }, { $set: { isLive: false, isBusy: false } });
        notifyHostStatus(host._id);
        continue;
      }

      const history = await LiveBroadcastHistory.findById(host.liveHistoryId)
        .select("startTime endTime lastHeartbeatAt updatedAt")
        .lean();

      // pointer to a missing / already finished session -> repair the host flag
      if (!history || (history.endTime && history.endTime !== "")) {
        await resetHostIfStillPointing(host._id, host.liveHistoryId);
        notifyHostStatus(host._id);
        log("LIVE_STALE", { hostId: key, sessionId: String(host.liveHistoryId), action: "host_flag_repaired" });
        reaped += 1;
        continue;
      }

      const hb = history.lastHeartbeatAt ? new Date(history.lastHeartbeatAt).getTime() : 0;
      const socketOnline = hostHasSocket(host._id); // true | false | null(unknown)

      if (socketOnline === false) {
        if (!offlineSince.has(key)) offlineSince.set(key, now);
      } else {
        offlineSince.delete(key);
      }

      let endedAtMs = null;
      if (hb && now - hb > staleMs) {
        if (socketOnline === true && now - hb <= getStaleWithSocketMs()) {
          // heartbeat is late but the host's socket is connected: temporary silence, not a dead live
          log("LIVE_STALE", { hostId: key, sessionId: String(history._id), action: "kept_socket_still_connected", silentSeconds: Math.floor((now - hb) / 1000) });
        } else {
          endedAtMs = hb; // heartbeat-aware client went silent (and no verified connection)
        }
      } else if (!hb && socketOnline === false && now - offlineSince.get(key) >= staleMs) {
        endedAtMs = offlineSince.get(key); // legacy client: socket gone, nothing else to trust
      }

      if (endedAtMs === null) continue;

      log("LIVE_STALE", { hostId: key, sessionId: String(history._id), lastSeen: new Date(endedAtMs).toISOString() });
      const r = await finalizeLiveSession({
        hostId: host._id,
        historyId: history._id,
        endedAtMs,
        reason: "stale-timeout",
      });
      if (r.finalized) reaped += 1;
      offlineSince.delete(key);
    } catch (err) {
      console.error(`[LIVE_STALE] host ${key} failed: ${err.message}`);
    }
  }

  return reaped;
};

let reaperTimer = null;
let reaperRunning = false;

const startLiveSessionReaper = () => {
  if (reaperTimer) return;
  const tick = async () => {
    if (reaperRunning) return;
    reaperRunning = true;
    try {
      const n = await reapStaleSessions();
      if (n > 0) console.log(`[LIVE_STALE] reaper finalized ${n} session(s)`);
    } catch (err) {
      console.error("[LIVE_STALE] reaper failed:", err.message);
    } finally {
      reaperRunning = false;
    }
  };
  // first pass after a short delay so sockets can reconnect after a server restart
  setTimeout(tick, 45 * 1000).unref?.();
  reaperTimer = setInterval(tick, REAPER_INTERVAL_MS);
  if (reaperTimer.unref) reaperTimer.unref();
  console.log(`[LIVE_STALE] reaper started (stale after ${getStaleMs() / 1000}s)`);
};

module.exports = {
  OPEN_SESSION,
  formatDuration,
  finalizeLiveSession,
  finalizeOpenSessionsForHost,
  checkActiveSession,
  recordHeartbeat,
  reapStaleSessions,
  startLiveSessionReaper,
};
