/**
 * Host "My Live Performance" totals.
 *
 * Source of truth: LiveBroadcastHistory (the same collection services/liveSession.service.js finalizes;
 * it also holds every historical session). One document = one session, so a session can never be counted
 * twice. Durations are always recomputed from the server-written startTime / endTime timestamps (never from
 * the formatted `duration` string, and never from anything the app sends).
 *
 *  - completed  : valid startTime + endTime (end >= start)           -> counted
 *  - ongoing    : endTime empty AND it is the host's current live    -> reported separately (elapsed so far)
 *  - interrupted: endTime empty and not the current live (reaper has not closed it) -> NOT counted
 *  - corrupt    : unparsable timestamps / end before start          -> NOT counted
 */
const LiveBroadcastHistory = require("../models/liveBroadcastHistory.model");
const Host = require("../models/host.model");

const CACHE_MS = 15 * 1000;
const cache = new Map(); // hostId -> { at, value }

const parseMs = (v) => {
  if (!v || typeof v !== "string") return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
};

const isOpen = (endTime) => endTime === "" || endTime === null || endTime === undefined;

const formatHMS = (totalSeconds) => {
  const t = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h}h ${m}m ${s}s`;
};

const getHostLiveStats = async (hostId, { now = Date.now(), useCache = true } = {}) => {
  const key = String(hostId);
  const hit = cache.get(key);
  if (useCache && hit && now - hit.at < CACHE_MS) return hit.value;

  const host = await Host.findById(hostId).select("isLive liveHistoryId").lean();
  const currentLiveId = host?.isLive && host.liveHistoryId ? String(host.liveHistoryId) : null;

  let totalSessions = 0;
  let totalLiveSeconds = 0;
  let interruptedSessions = 0;
  let ongoing = { active: false, elapsedSeconds: 0 };
  const seen = new Set();

  const cursor = LiveBroadcastHistory.find({ hostId }).select("_id startTime endTime").lean().cursor();
  for await (const row of cursor) {
    const id = String(row._id);
    if (seen.has(id)) continue;
    seen.add(id);

    const start = parseMs(row.startTime);
    if (start === null) continue; // corrupt

    if (isOpen(row.endTime)) {
      if (id === currentLiveId) {
        ongoing = { active: true, elapsedSeconds: Math.max(0, Math.floor((now - start) / 1000)) };
      } else {
        interruptedSessions += 1;
      }
      continue;
    }

    const end = parseMs(row.endTime);
    if (end === null || end < start) continue; // corrupt

    totalSessions += 1;
    totalLiveSeconds += Math.floor((end - start) / 1000);
  }

  const value = {
    totalSessions,
    totalLiveSeconds,
    totalLiveDuration: formatHMS(totalLiveSeconds),
    ongoing,
    interruptedSessions,
    serverTime: new Date(now).toISOString(),
  };
  cache.set(key, { at: now, value });
  return value;
};

module.exports = { getHostLiveStats, formatHMS, parseMs };
