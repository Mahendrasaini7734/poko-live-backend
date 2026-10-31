/**
 * Dashboard V2: ONE aggregated, date-range aware, growth-aware read API (+ chart series).
 *  - feed numbers come from feedManagement.computeFeedStats (same function Feed Management uses)
 *  - live "current" numbers come from liveAnalytics snapshot / Host.isLive, history from LiveBroadcastHistory
 *  - date policy: util/dateRange (IST calendar days, inclusive), previous period = same length right before
 * Every metric: { total?, period, previous, growth }  (growth null = no baseline -> UI shows "New")
 */
const FeedPost = require("../../models/feedPost.model");
const FeedView = require("../../models/feedView.model");
const FeedLike = require("../../models/feedLike.model");
const FeedComment = require("../../models/feedComment.model");
const FeedShare = require("../../models/feedShare.model");
const History = require("../../models/history.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const Report = require("../../models/report.model");
const WithdrawalRequest = require("../../models/withdrawalRequest.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const { HISTORY_TYPE, HOST_REQUEST_STATUS, WITHDRAWAL_STATUS } = require("../../types/constant");
const { parseRange, growthPct, dayBucket, durSec, TZ } = require("../../util/dateRange");
const { computeFeedStats } = require("./feedManagement.controller");
const moment = require("moment-timezone");

const between = (a, b) => ({ $gte: a, $lte: b });
const metric = (total, period, previous) => ({ total, period, previous, growth: growthPct(period, previous) });
const bad = (res, message) => res.status(200).json({ status: false, message });

// tiny burst cache (events can trigger many refetches): same range -> same answer for 2s
const cache = new Map();
const cached = (key, fn, ttl = 2000) => {
  const hit = cache.get(key);
  if (hit?.v && Date.now() - hit.t < ttl) return Promise.resolve(hit.v);
  if (hit?.p) return hit.p; // identical request already running -> share it
  const p = fn().then(
    (v) => { cache.set(key, { t: Date.now(), v }); return v; },
    (e) => { cache.delete(key); throw e; }
  );
  cache.set(key, { ...(hit || {}), p });
  if (cache.size > 50) cache.delete(cache.keys().next().value);
  return p;
};

const liveAgg = (r) =>
  LiveBroadcastHistory.aggregate([
    { $match: { createdAt: between(r.start, r.end) } },
    { $group: { _id: null, sessions: { $sum: 1 }, hosts: { $addToSet: "$hostId" }, seconds: { $sum: durSec("$duration") }, viewers: { $sum: "$audienceCount" }, peak: { $max: "$audienceCount" }, gifts: { $sum: "$gifts" }, diamonds: { $sum: "$coins" }, ended: { $sum: { $cond: [{ $ifNull: ["$endTime", false] }, 1, 0] } } } },
  ]).then((x) => {
    const o = x[0] || { sessions: 0, hosts: [], seconds: 0, viewers: 0, peak: 0, gifts: 0, diamonds: 0, ended: 0 };
    return { ...o, hosts: o.hosts.length, avg: o.sessions ? Math.round(o.viewers / o.sessions) : 0 };
  });

const moneyAgg = (r) =>
  History.aggregate([
    { $match: { createdAt: between(r.start, r.end), $or: [{ hostCoin: { $gt: 0 } }, { adminCoin: { $gt: 0 } }, { agencyCoin: { $gt: 0 } }] } },
    { $group: { _id: null, admin: { $sum: "$adminCoin" }, host: { $sum: "$hostCoin" }, agency: { $sum: "$agencyCoin" } } },
  ]).then((x) => x[0] || { admin: 0, host: 0, agency: 0 });

async function buildOverview(range) {
  const cur = between(range.start, range.end), prev = between(range.prevStart, range.prevEnd);
  const created = (M, r, extra = {}) => M.countDocuments({ createdAt: r, ...extra });
  const realHost = { status: HOST_REQUEST_STATUS.ACCEPTED, isFake: false };

  const [feed, uC, uP, hC, hP, totalUsers, totalHosts, onlineUsers, onlineHosts, pendingHosts, liveNow,
    rC, rP, rTotal, tC, tP, wPending, wC, wP, liveC, liveP, moneyC, moneyP] = await Promise.all([
    computeFeedStats(range),
    created(User, cur), created(User, prev), created(Host, cur, realHost), created(Host, prev, realHost),
    User.estimatedDocumentCount(), Host.countDocuments(realHost),
    User.countDocuments({ isOnline: true }), Host.countDocuments({ ...realHost, isOnline: true }),
    Host.countDocuments({ status: HOST_REQUEST_STATUS.PENDING, isFake: false }),
    Host.countDocuments({ ...realHost, isLive: true }),
    created(Report, cur), created(Report, prev), Report.estimatedDocumentCount(),
    created(History, cur), created(History, prev),
    WithdrawalRequest.countDocuments({ status: WITHDRAWAL_STATUS.PENDING }), created(WithdrawalRequest, cur), created(WithdrawalRequest, prev),
    liveAgg({ start: range.start, end: range.end }), liveAgg({ start: range.prevStart, end: range.prevEnd }),
    moneyAgg({ start: range.start, end: range.end }), moneyAgg({ start: range.prevStart, end: range.prevEnd }),
  ]);

  // live "right now" numbers (NOT period based): authoritative live analytics snapshot, Host.isLive as the base
  let currentViewers = null, currentRooms = null;
  try {
    const snap = await require("../../services/liveAnalytics.service").getSnapshot();
    currentViewers = snap?.counters?.totalViewers ?? null;
    currentRooms = snap?.counters?.liveRooms ?? null;
  } catch (e) { /* optional */ }

  return {
    range: { startDate: range.startDate, endDate: range.endDate, tz: TZ, days: range.days },
    generatedAt: new Date(),
    platform: {
      totalUsers: metric(totalUsers, uC, uP),                       // total = all users, period = new registrations
      totalHosts: metric(totalHosts, hC, hP),                       // approved real hosts
      onlineUsers: { current: onlineUsers },                         // presence, right now
      onlineHosts: { current: onlineHosts },
      pendingHostVerifications: { current: pendingHosts },
      pendingWithdrawals: { current: wPending, ...metric(null, wC, wP), label: "new requests in period" },
      reportedContent: metric(rTotal, rC, rP),
      walletTransactions: metric(null, tC, tP),
    },
    earnings: {
      adminCommission: metric(null, moneyC.admin, moneyP.admin),
      hostEarnings: metric(null, moneyC.host, moneyP.host),
      agencyEarnings: metric(null, moneyC.agency, moneyP.agency),
    },
    feed,
    live: {
      current: { liveHosts: liveNow, liveRooms: currentRooms, viewers: currentViewers },
      sessions: metric(null, liveC.sessions, liveP.sessions),
      hostsWentLive: metric(null, liveC.hosts, liveP.hosts),
      durationSeconds: metric(null, liveC.seconds, liveP.seconds),
      viewers: metric(null, liveC.viewers, liveP.viewers),
      peakViewers: metric(null, liveC.peak, liveP.peak), // highest audience of a single session in the period
      avgViewers: metric(null, liveC.avg, liveP.avg),
      gifts: metric(null, liveC.gifts, liveP.gifts),
      diamonds: metric(null, liveC.diamonds, liveP.diamonds),
      completion: { ended: liveC.ended, total: liveC.sessions, previousEnded: liveP.ended, previousTotal: liveP.sessions },
    },
  };
}

/** merge: values = all-time run; growth = trailing-30-days run (basis: last 30 days vs the 30 days before) */
const mergeAll = (all, recent) => {
  if (all && typeof all === "object" && !Array.isArray(all) && !(all instanceof Date)) {
    if ("growth" in all && recent && typeof recent === "object" && "growth" in recent) {
      return { ...all, growth: recent.growth, recent: recent.period, recentPrevious: recent.previous, growthBasis: "last30" };
    }
    const out = {};
    Object.keys(all).forEach((k) => { out[k] = recent ? mergeAll(all[k], recent[k]) : all[k]; });
    return out;
  }
  return all;
};

async function buildOverviewAll() {
  const now = new Date();
  const epoch = new Date(0);
  const allRange = { startDate: "All", endDate: "All", days: null, start: epoch, end: now, prevStart: epoch, prevEnd: epoch };
  const r30 = parseRange({}, { defaultDays: 30 });
  const [all, recent] = await Promise.all([buildOverview(allRange), buildOverview(r30)]);
  const merged = mergeAll(all, recent);
  merged.range = { startDate: "All", endDate: "All", tz: TZ, days: null, mode: "all", growthBasis: { startDate: r30.startDate, endDate: r30.endDate } };
  return merged;
}

exports.overview = async (req, res) => {
  try {
    if (String(req.query.range || "").toLowerCase() === "all") {
      const data = await cached("ov:all", buildOverviewAll);
      res.set("Cache-Control", "no-store");
      return res.status(200).json({ status: true, message: "Dashboard overview (overall)", data });
    }
    const range = parseRange(req.query);
    if (!range.ok) return bad(res, range.message);
    const data = await cached(`ov:${range.startDate}:${range.endDate}`, () => buildOverview(range));
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "Dashboard overview", data });
  } catch (e) { console.error("DASHBOARD V2 OVERVIEW ERROR =>", e); return res.status(500).json({ status: false, message: e.message }); }
};

const fill = (range, maps, keys) => {
  const out = [];
  for (let d = moment.tz(range.startDate, "YYYY-MM-DD", TZ); !d.isAfter(moment.tz(range.endDate, "YYYY-MM-DD", TZ)); d.add(1, "day")) {
    const k = d.format("YYYY-MM-DD"); const row = { date: k };
    keys.forEach((key) => { row[key] = maps[key]?.get(k) || 0; });
    out.push(row);
  }
  return out;
};
const toMap = (rows, f = "n") => new Map(rows.map((x) => [x._id, x[f]]));

async function buildTrends(range) {
  const m = { createdAt: between(range.start, range.end) };
  const day = dayBucket("$createdAt");
  const daily = (Model, match = {}, grp = { n: { $sum: 1 } }) => Model.aggregate([{ $match: { ...m, ...match } }, { $group: { _id: day, ...grp } }]);
  const feedGift = { type: HISTORY_TYPE.GIFT_IN_FEED };

  const [posts, views, likes, comments, shares, fg, lv, newUsers, newHosts, money, tx] = await Promise.all([
    daily(FeedPost), daily(FeedView), daily(FeedLike), daily(FeedComment), daily(FeedShare),
    daily(History, feedGift, { n: { $sum: "$giftCount" }, diamonds: { $sum: "$userCoin" }, income: { $sum: "$hostCoin" } }),
    daily(LiveBroadcastHistory, {}, { sessions: { $sum: 1 }, viewers: { $sum: "$audienceCount" }, seconds: { $sum: durSec("$duration") }, peak: { $max: "$audienceCount" }, gifts: { $sum: "$gifts" }, diamonds: { $sum: "$coins" } }),
    daily(User), daily(Host, { status: HOST_REQUEST_STATUS.ACCEPTED, isFake: false }),
    daily(History, { $or: [{ hostCoin: { $gt: 0 } }, { adminCoin: { $gt: 0 } }] }, { admin: { $sum: "$adminCoin" }, host: { $sum: "$hostCoin" } }),
    daily(History),
  ]);
  return {
    range: { startDate: range.startDate, endDate: range.endDate, tz: TZ },
    feed: fill(range, { posts: toMap(posts), views: toMap(views), likes: toMap(likes), comments: toMap(comments), shares: toMap(shares), gifts: toMap(fg), diamonds: toMap(fg, "diamonds") }, ["posts", "views", "likes", "comments", "shares", "gifts", "diamonds"]),
    live: fill(range, { sessions: toMap(lv, "sessions"), viewers: toMap(lv, "viewers"), peak: toMap(lv, "peak"), minutes: new Map(lv.map((x) => [x._id, Math.round(x.seconds / 60)])), gifts: toMap(lv, "gifts"), diamonds: toMap(lv, "diamonds") }, ["sessions", "viewers", "peak", "minutes", "gifts", "diamonds"]),
    platform: fill(range, { users: toMap(newUsers), hosts: toMap(newHosts), adminEarnings: toMap(money, "admin"), hostEarnings: toMap(money, "host"), transactions: toMap(tx) }, ["users", "hosts", "adminEarnings", "hostEarnings", "transactions"]),
  };
}

exports.trends = async (req, res) => {
  try {
    const range = String(req.query.range || "").toLowerCase() === "all" ? parseRange({}, { defaultDays: 30 }) : parseRange(req.query);
    if (!range.ok) return bad(res, range.message);
    const data = await cached(`tr:${range.startDate}:${range.endDate}`, () => buildTrends(range));
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "Dashboard trends", data });
  } catch (e) { console.error("DASHBOARD V2 TRENDS ERROR =>", e); return res.status(500).json({ status: false, message: e.message }); }
};
