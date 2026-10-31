/**
 * Admin Feed Management + Host Profile & Performance.
 *
 * Reuses existing collections only (FeedPost / FeedLike / FeedView / FeedComment / FeedShare, History,
 * Host, LiveBroadcastHistory, FollowerFollowing, Report). Everything is server-side paginated /
 * filtered and computed with aggregations - the list never populates per row.
 *
 * Money rules come from History rows (hostCoin / agencyCoin / adminCoin written when the gift was
 * sent), so revenue share always reflects the rule that applied at that time - nothing is hardcoded.
 */
const mongoose = require("mongoose");
const FeedPost = require("../../models/feedPost.model");
const FeedLike = require("../../models/feedLike.model");
const FeedView = require("../../models/feedView.model");
const FeedComment = require("../../models/feedComment.model");
const FeedShare = require("../../models/feedShare.model");
const History = require("../../models/history.model");
const Host = require("../../models/host.model");
const Report = require("../../models/report.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const { HISTORY_TYPE } = require("../../types/constant");
const { getMediaUrl } = require("../../util/media");
const FeedShareModel = FeedShare;
const { success, error } = require("../../util/response");
const { FEED_EVENTS, emitFeedEvent } = require("../../services/feedRealtime.service");

const OID = mongoose.Types.ObjectId;
const isOid = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toInt = (v, d, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || d));

const FEED_GIFT_TYPES = [HISTORY_TYPE.GIFT_IN_FEED];
const ALL_GIFT_TYPES = [HISTORY_TYPE.GIFT_IN_LIVE, HISTORY_TYPE.GIFT_IN_VIDEO_CALL, HISTORY_TYPE.GIFT_IN_CHAT, HISTORY_TYPE.GIFT_IN_FEED];

// ---------------- helpers ----------------
const { parseRange, TZ } = require("../../util/dateRange");
/** { start, end, prevStart, prevEnd } in the application timezone (IST); invalid input falls back to the last 30 days */
const resolveRange = (q) => {
  const r = parseRange(q);
  return r.ok ? r : parseRange({});
};
const growth = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0);
const between = (a, b) => ({ $gte: a, $lte: b });
const pagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 });

/** HH:MM:SS string -> seconds, inside an aggregation */
const durSec = (f) => ({
  $let: {
    vars: { p: { $split: [{ $ifNull: [f, "00:00:00"] }, ":"] } },
    in: {
      $add: [
        { $multiply: [{ $convert: { input: { $arrayElemAt: ["$$p", 0] }, to: "int", onError: 0, onNull: 0 } }, 3600] },
        { $multiply: [{ $convert: { input: { $arrayElemAt: ["$$p", 1] }, to: "int", onError: 0, onNull: 0 } }, 60] },
        { $convert: { input: { $arrayElemAt: ["$$p", 2] }, to: "int", onError: 0, onNull: 0 } },
      ],
    },
  },
});

const sumGift = (match) =>
  History.aggregate([
    { $match: match },
    { $group: { _id: null, count: { $sum: "$giftCount" }, income: { $sum: "$hostCoin" }, total: { $sum: "$userCoin" }, admin: { $sum: "$adminCoin" }, agency: { $sum: "$agencyCoin" }, host: { $sum: "$hostCoin" } } },
  ]).then((r) => r[0] || { count: 0, income: 0, total: 0, admin: 0, agency: 0, host: 0 });

const split = (g) => {
  const t = (g.admin || 0) + (g.agency || 0) + (g.host || 0);
  const pct = (v) => (t > 0 ? Math.round((v / t) * 1000) / 10 : 0);
  return { total: t, admin: { diamonds: g.admin || 0, percent: pct(g.admin) }, agency: { diamonds: g.agency || 0, percent: pct(g.agency) }, host: { diamonds: g.host || 0, percent: pct(g.host) } };
};

/** host.image / user.image may be a string OR {url,key}; media items are {url,key} -> always return one absolute CDN URL */
const mUrl = (m) => { try { return getMediaUrl(m) || ""; } catch (e) { return ""; } };

const ALLOWED = new Set(["h1", "h2", "h3", "h4", "p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "blockquote", "span", "div"]);
/** whitelist sanitizer: keeps simple formatting tags, drops every attribute and every other tag/script */
const safeHtml = (c) => {
  let t = String(c || "").replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "");
  t = t.replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (m, tag) => (ALLOWED.has(tag.toLowerCase()) ? (m.startsWith("</") ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`) : ""));
  return t.trim();
};
const hasHtml = (c) => /<[a-z][\s\S]*>/i.test(String(c || ""));

const caption = (c) => String(c || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim(); // never ship raw HTML
const hashtags = (c) => Array.from(new Set((caption(c).match(/#[\p{L}\p{N}_]+/gu) || []))).slice(0, 12);

const hostCard = (h) =>
  h && {
    _id: h._id, name: h.name || "", image: mUrl(h.image), uniqueId: h.uniqueId || "", country: h.country || "",
    isBlock: !!h.isBlock, isFake: !!h.isFake, isOnline: !!h.isOnline, isLive: !!h.isLive,
    isVerified: h.status === 2, // HOST_REQUEST_STATUS accepted
    level: h.level ?? null, // no host-level field exists in the Host model yet
  };

const postStatus = (p, reports) => (reports > 0 && p.moderation === "active" ? "reported" : p.moderation || (p.status ? "active" : "blocked"));

const mapPost = (p, host, gi, rep) => ({
  _id: p._id, hostId: p.hostId, type: p.type,
  isReel: p.type === "video",
  mediaUrl: mUrl(p.media?.[0]), videoUrl: p.type === "video" ? mUrl(p.media?.[0]) : "", thumbnail: p.type === "image" ? mUrl(p.media?.[0]) : mUrl(p.media?.[0]?.thumbnail || ""), mediaUrls: (p.media || []).map(mUrl), mediaCount: p.media?.length || 0,
  caption: caption(p.caption), captionHtml: hasHtml(p.caption) ? safeHtml(p.caption) : "", hashtags: hashtags(p.caption),
  views: p.views || 0, likes: p.likes || 0, comments: p.comments || 0, shares: p.shares || 0,
  giftCount: gi?.count || 0, income: gi?.income || 0,
  reports: rep || 0, status: postStatus(p, rep), moderation: p.moderation || "active",
  createdAt: p.createdAt, host: hostCard(host),
});

/** gift + report counters for a page of post ids only (never for the whole collection) */
const pageExtras = async (ids) => {
  const [g, r] = await Promise.all([
    History.aggregate([{ $match: { feedPostId: { $in: ids }, type: { $in: FEED_GIFT_TYPES } } }, { $group: { _id: "$feedPostId", count: { $sum: "$giftCount" }, income: { $sum: "$hostCoin" } } }]),
    Report.aggregate([{ $match: { feedPostId: { $in: ids } } }, { $group: { _id: "$feedPostId", n: { $sum: 1 } } }]),
  ]);
  return { gifts: new Map(g.map((x) => [String(x._id), x])), reports: new Map(r.map((x) => [String(x._id), x.n])) };
};

// tab -> base filter. New content types = one more line here (frontend tabs are driven by /tabs).
const TABS = {
  all: () => ({}),
  images: () => ({ type: "image" }),
  videos: () => ({ type: "video" }),
  reels: () => ({ type: "video" }),
  text: () => ({ type: "text" }),
  top: () => ({ status: true }),
  archived: () => ({ moderation: "archived" }),
};

/** shared by the global list and the per-host list (hostId forced from the URL) */
const buildFeedMatch = async (q, forcedHostId) => {
  const tab = (q.tab || "all").toLowerCase();
  const m = { ...(TABS[tab] ? TABS[tab]() : {}) };
  if (q.type && q.type !== "all") m.type = q.type;

  const hostId = forcedHostId || q.hostId;
  if (hostId && hostId !== "all") { if (!isOid(hostId)) return { empty: true }; m.hostId = new OID(hostId); }

  const st = (q.status || "all").toLowerCase();
  if (st === "active") m.moderation = { $in: ["active", null] }, m.status = true;
  else if (st === "archived" || st === "blocked") m.moderation = st;

  if (q.startDate || q.endDate) {
    const { start, end } = resolveRange(q);
    m.createdAt = between(start, end);
  }

  if (tab === "reported") {
    const ids = await Report.distinct("feedPostId", { feedPostId: { $type: "objectId" } });
    m._id = { $in: ids.slice(0, 5000) };
  }

  const s = String(q.search || "").trim().slice(0, 80);
  if (s) {
    if (isOid(s)) m._id = new OID(s);
    else {
      const rx = new RegExp(esc(s), "i");
      const hosts = forcedHostId ? [] : await Host.find({ $or: [{ name: rx }, { uniqueId: rx }] }).select("_id").limit(200).lean();
      m.$or = [{ caption: rx }, ...(hosts.length ? [{ hostId: { $in: hosts.map((h) => h._id) } }] : [])];
    }
  }
  return { match: m, tab };
};

const listFeeds = async (req, res, forcedHostId) => {
  try {
    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 10, 1, 100);
    const { match, tab, empty } = await buildFeedMatch(req.query, forcedHostId);
    if (empty) return success(res, { data: [], pagination: pagination(0, page, limit) });

    const sortKey = tab === "top" ? { views: -1, _id: -1 } : { createdAt: -1, _id: -1 };
    const [posts, total] = await Promise.all([
      FeedPost.find(match).sort(sortKey).skip((page - 1) * limit).limit(limit).lean(),
      FeedPost.countDocuments(match),
    ]);
    const hostIds = [...new Set(posts.map((p) => String(p.hostId)))].map((i) => new OID(i));
    const [hosts, ex] = await Promise.all([
      Host.find({ _id: { $in: hostIds } }).select("name image uniqueId country isBlock isFake isOnline isLive status").lean(),
      pageExtras(posts.map((p) => p._id)),
    ]);
    const hm = new Map(hosts.map((h) => [String(h._id), h]));
    const data = posts.map((p) => mapPost(p, hm.get(String(p.hostId)), ex.gifts.get(String(p._id)), ex.reports.get(String(p._id))));
    res.set("Cache-Control", "no-store");
    return success(res, { data, pagination: pagination(total, page, limit) });
  } catch (e) {
    console.error("ADMIN FEED LIST ERROR =>", e);
    return error(res, e.message, 500);
  }
};

exports.list = (req, res) => listFeeds(req, res, null);
exports.hostFeeds = (req, res) => {
  if (!isOid(req.params.hostId)) return error(res, "Invalid hostId", 400);
  return listFeeds(req, res, req.params.hostId);
};

// ---------------- global statistics ----------------
/**
 * Authoritative feed KPIs for a period (+ previous comparable period). Feed Management AND the dashboard call this,
 * so both always show identical numbers.  Same post is never counted twice: posts are counted from FeedPost,
 * interactions from their own collections by createdAt.
 */
const computeFeedStats = async (range) => {
  const { start, end, prevStart, prevEnd } = range;
  const cur = between(start, end), prev = between(prevStart, prevEnd);
  const cnt = (M, r, extra = {}) => M.countDocuments({ createdAt: r, ...extra });
  const gift = (r) => sumGift({ type: { $in: FEED_GIFT_TYPES }, createdAt: r });
  const hostsIn = (r) => FeedPost.distinct("hostId", { createdAt: r }).then((a) => a.length);
  const reported = (r) => Report.distinct("feedPostId", { feedPostId: { $type: "objectId" }, createdAt: r }).then((a) => a.length);

  const [all, tot, pc, pp, vc, vp, lc, lp, gc, gp, hc, hp, ac, cc, cp, sc, sp, ic, ip, rc, rp, rcAll, imgAll] = await Promise.all([
    FeedPost.countDocuments({}),
    // lifetime totals come from the SAME collections the period numbers use (FeedPost.likes/comments counters can drift)
    Promise.all([FeedView.estimatedDocumentCount(), FeedLike.estimatedDocumentCount(), FeedComment.estimatedDocumentCount(), FeedShare.estimatedDocumentCount()]).then(([views, likes, comments, shares]) => [{ views, likes, comments, shares }]),
    cnt(FeedPost, cur), cnt(FeedPost, prev), cnt(FeedView, cur), cnt(FeedView, prev), cnt(FeedLike, cur), cnt(FeedLike, prev),
    gift(cur), gift(prev), hostsIn(cur), hostsIn(prev),
    FeedPost.distinct("hostId", {}).then((a) => a.length),
    cnt(FeedComment, cur), cnt(FeedComment, prev), cnt(FeedShare, cur), cnt(FeedShare, prev),
    cnt(FeedPost, cur, { type: "image" }), cnt(FeedPost, prev, { type: "image" }),
    reported(cur), reported(prev),
    Report.distinct("feedPostId", { feedPostId: { $type: "objectId" } }).then((a) => a.length),
    FeedPost.countDocuments({ type: "image" }),
  ]);
  const reelsCur = pc - ic, reelsPrev = pp - ip; // FeedPost.type is image|video, reels == video posts
  const t = tot[0] || { views: 0, likes: 0, comments: 0, shares: 0 };
  const card = (total, c, p) => ({ total, period: c, previous: p, growth: growth(c, p) });
  return {
    range: { start, end, prevStart, prevEnd },
    totalPosts: card(all, pc, pp),
    totalViews: card(t.views, vc, vp),
    totalLikes: card(t.likes, lc, lp),
    totalComments: card(t.comments, cc, cp),
    totalShares: card(t.shares, sc, sp),
    totalGifts: card(null, gc.count, gp.count),
    totalIncome: card(null, gc.income, gp.income),
    activeHosts: { total: ac, period: hc, previous: hp, growth: growth(hc, hp) },
    imagePosts: card(imgAll, ic, ip),
    reels: card(all - imgAll, reelsCur, reelsPrev),
    reportedFeeds: card(rcAll, rc, rp),
  };
};
exports.computeFeedStats = computeFeedStats;

exports.stats = async (req, res) => {
  try {
    const data = await computeFeedStats(resolveRange(req.query));
    res.set("Cache-Control", "no-store");
    return success(res, {
      ...data,
      tabs: [
        { key: "all", label: "All Feeds" }, { key: "images", label: "Image Posts" }, { key: "reels", label: "Reels" },
        { key: "top", label: "Top Performing" }, { key: "reported", label: "Reported Feeds" }, { key: "archived", label: "Archived" },
      ],
    });
  } catch (e) { console.error("ADMIN FEED STATS ERROR =>", e); return error(res, e.message, 500); }
};

// ---------------- single feed: detail + insights + earnings + gifts ----------------
exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isOid(id)) return error(res, "Invalid feed id", 400);
    const post = await FeedPost.findById(id).lean();
    if (!post) return error(res, "Feed not found", 404);
    const pid = post._id;
    const [host, followers, ex, g, gifts, c, s, r] = await Promise.all([
      Host.findById(post.hostId).select("name image uniqueId country isBlock isFake isOnline isLive status").lean(),
      FollowerFollowing.countDocuments({ followingId: post.hostId }),
      pageExtras([pid]),
      sumGift({ feedPostId: pid, type: { $in: FEED_GIFT_TYPES } }),
      History.aggregate([
        { $match: { feedPostId: pid, type: { $in: FEED_GIFT_TYPES } } },
        { $group: { _id: "$giftId", quantity: { $sum: "$giftCount" }, diamonds: { $sum: "$userCoin" }, image: { $first: "$giftImage" } } },
        { $sort: { diamonds: -1 } }, { $limit: 10 },
        { $lookup: { from: "gifts", localField: "_id", foreignField: "_id", as: "gift", pipeline: [{ $project: { name: 1, imageUrl: 1 } }] } },
      ]),
      FeedComment.countDocuments({ postId: pid }), FeedShare.countDocuments({ postId: pid }), Report.countDocuments({ feedPostId: pid }),
    ]);
    const base = mapPost(post, host, ex.gifts.get(String(pid)), r);
    res.set("Cache-Control", "no-store");
    return success(res, {
      post: { ...base, shares: Math.max(base.shares, s), comments: Math.max(base.comments, c), hostFollowers: followers },
      insights: { views: base.views, likes: base.likes, comments: base.comments, shares: base.shares, avgWatchTime: null /* not tracked by the app yet */ },
      earnings: { totalDiamonds: g.total, ...split(g) },
      topGifts: gifts.map((x) => ({ giftId: x._id, name: x.gift?.[0]?.name || "Gift", image: mUrl(x.gift?.[0]?.imageUrl || x.image || ""), quantity: x.quantity, diamonds: x.diamonds })),
    });
  } catch (e) { console.error("ADMIN FEED DETAIL ERROR =>", e); return error(res, e.message, 500); }
};

// ---------------- moderation (status change / delete) ----------------
exports.setModeration = async (req, res) => {
  try {
    const { id } = req.params; const state = req.body?.status;
    if (!isOid(id) || !["active", "archived", "blocked"].includes(state)) return error(res, "Invalid request", 400);
    const post = await FeedPost.findByIdAndUpdate(id, { moderation: state, status: state === "active" }, { new: true }).lean();
    if (!post) return error(res, "Feed not found", 404);
    if (state !== "active") emitFeedEvent(FEED_EVENTS.DELETED, { feedId: id, hostId: post.hostId, action: state, updatedCount: 0 }); // hide in app galleries
    return success(res, { _id: id, moderation: state }, "Feed updated");
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateCaption = async (req, res) => {
  try {
    const { id } = req.params; const c = String(req.body?.caption ?? "").trim().slice(0, 2200);
    if (!isOid(id)) return error(res, "Invalid feed id", 400);
    const post = await FeedPost.findByIdAndUpdate(id, { caption: c }, { new: true }).lean();
    if (!post) return error(res, "Feed not found", 404);
    return success(res, { _id: id, caption: caption(c) }, "Caption updated");
  } catch (e) { return error(res, e.message, 500); }
};

// ---------------- host profile & performance ----------------
const needHost = async (req, res) => {
  const { hostId } = req.params;
  if (!isOid(hostId)) { error(res, "Invalid hostId", 400); return null; }
  const host = await Host.findById(hostId).populate("agencyId", "name agencyCode").lean();
  if (!host) { error(res, "Host not found", 404); return null; }
  return host;
};

exports.hostProfile = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const hid = host._id;
    const { start, end, prevStart, prevEnd } = resolveRange(req.query);
    const cur = between(start, end), prev = between(prevStart, prevEnd);

    const liveAgg = (r) => LiveBroadcastHistory.aggregate([
      { $match: { hostId: hid, createdAt: r } },
      { $group: { _id: null, sessions: { $sum: 1 }, seconds: { $sum: durSec("$duration") }, avgViewers: { $avg: "$audienceCount" }, diamonds: { $sum: "$coins" }, gifts: { $sum: "$gifts" } } },
    ]).then((x) => x[0] || { sessions: 0, seconds: 0, avgViewers: 0, diamonds: 0, gifts: 0 });
    const feedAgg = (r) => FeedPost.aggregate([{ $match: { hostId: hid, ...(r ? { createdAt: r } : {}) } }, { $group: { _id: null, posts: { $sum: 1 }, views: { $sum: "$views" }, likes: { $sum: "$likes" }, comments: { $sum: "$comments" }, shares: { $sum: "$shares" } } }]).then((x) => x[0] || { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 });
    const giftAgg = (r) => sumGift({ hostId: hid, type: { $in: ALL_GIFT_TYPES }, ...(r ? { createdAt: r } : {}) });

    const postIds = await FeedPost.find({ hostId: hid }).distinct("_id");
    const newFollowers = (r) => FollowerFollowing.countDocuments({ followingId: hid, createdAt: r });
    const newFollowing = (r) => (host.userId ? FollowerFollowing.countDocuments({ followerId: host.userId, createdAt: r }) : 0);
    const newLikes = (r) => (postIds.length ? FeedLike.countDocuments({ postId: { $in: postIds }, createdAt: r }) : 0);

    const [followers, following, lifeFeed, curFeed, prevFeed, curLive, prevLive, curGift, prevGift, lifeGift, lastLive, fc, fp, gc, gp, lc, lp] = await Promise.all([
      FollowerFollowing.countDocuments({ followingId: hid }),
      host.userId ? FollowerFollowing.countDocuments({ followerId: host.userId }) : 0,
      feedAgg(null), feedAgg(cur), feedAgg(prev), liveAgg(cur), liveAgg(prev), giftAgg(cur), giftAgg(prev), giftAgg(null),
      LiveBroadcastHistory.findOne({ hostId: hid }).sort({ createdAt: -1 }).select("createdAt").lean(),
      newFollowers(cur), newFollowers(prev), newFollowing(cur), newFollowing(prev), newLikes(cur), newLikes(prev),
    ]);
    // header stat boxes: lifetime value + change of the selected period vs the previous period of the same length
    const hs = (value, c, p) => ({ value, period: c, previous: p, growth: growth(c, p) });
    const headerStats = {
      followers: hs(followers, fc, fp), following: hs(following, gc, gp), totalLikes: hs(lifeFeed.likes, lc, lp),
      totalDiamonds: hs(lifeGift.total, curGift.total, prevGift.total), totalPosts: hs(lifeFeed.posts, curFeed.posts, prevFeed.posts),
    };
    const g = (c, p) => ({ value: c, growth: growth(c, p) });
    res.set("Cache-Control", "no-store");
    return success(res, {
      profile: {
        ...hostCard(host), username: host.uniqueId, bio: host.bio || "", email: host.email || "", mobileNumber: host.mobileNumber || "", countryCode: host.countryCode || "",
        coverImage: mUrl(host.photoGallery?.[0]), dob: host.dob || "", age: host.age, gender: host.gender, joinedAt: host.createdAt,
        agency: host.agencyId ? { _id: host.agencyId._id, name: host.agencyId.name, code: host.agencyId.agencyCode } : null,
        hostType: host.isFake ? "Fake Host" : "Live Host", coin: host.coin || 0, lastOnlineAt: host.isOnline ? new Date() : lastLive?.createdAt || host.updatedAt,
        followers, following, totalLikes: lifeFeed.likes, totalDiamonds: lifeGift.total, totalPosts: lifeFeed.posts,
      },
      headerStats,
      overview: {
        range: { start, end },
        totalLikes: g(curFeed.likes, prevFeed.likes), totalViews: g(curFeed.views, prevFeed.views), totalPosts: g(curFeed.posts, prevFeed.posts),
        totalGifts: g(curGift.count, prevGift.count), totalDiamonds: g(curGift.total, prevGift.total),
        liveSessions: g(curLive.sessions, prevLive.sessions), liveSeconds: g(curLive.seconds, prevLive.seconds), avgViewers: g(Math.round(curLive.avgViewers || 0), Math.round(prevLive.avgViewers || 0)),
        engagement: g(curFeed.views ? Math.round(((curFeed.likes + curFeed.comments + curFeed.shares) / curFeed.views) * 1000) / 10 : 0, prevFeed.views ? Math.round(((prevFeed.likes + prevFeed.comments + prevFeed.shares) / prevFeed.views) * 1000) / 10 : 0),
      },
      live: { sessions: curLive.sessions, seconds: curLive.seconds, avgViewers: Math.round(curLive.avgViewers || 0), diamonds: curLive.diamonds },
    });
  } catch (e) { console.error("ADMIN HOST PROFILE ERROR =>", e); return error(res, e.message, 500); }
};

/** daily series for charts: live sessions / viewers / diamonds + gifts + feed earnings */
exports.hostTrends = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const { start, end } = resolveRange(req.query);
    const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } };
    const [live, gifts] = await Promise.all([
      LiveBroadcastHistory.aggregate([{ $match: { hostId: host._id, createdAt: between(start, end) } }, { $group: { _id: day, sessions: { $sum: 1 }, viewers: { $avg: "$audienceCount" }, diamonds: { $sum: "$coins" } } }, { $sort: { _id: 1 } }]),
      History.aggregate([{ $match: { hostId: host._id, type: { $in: ALL_GIFT_TYPES }, createdAt: between(start, end) } }, { $group: { _id: day, gifts: { $sum: "$giftCount" }, diamonds: { $sum: "$hostCoin" } } }, { $sort: { _id: 1 } }]),
    ]);
    return success(res, { live: live.map((x) => ({ date: x._id, sessions: x.sessions, viewers: Math.round(x.viewers || 0), diamonds: x.diamonds })), gifts: gifts.map((x) => ({ date: x._id, gifts: x.gifts, diamonds: x.diamonds })) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.hostLiveHistory = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const page = toInt(req.query.page, 1, 1, 100000), limit = toInt(req.query.limit, 10, 1, 100);
    const m = { hostId: host._id };
    if (req.query.startDate || req.query.endDate) { const { start, end } = resolveRange(req.query); m.createdAt = between(start, end); }
    const [rows, total] = await Promise.all([
      LiveBroadcastHistory.find(m).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      LiveBroadcastHistory.countDocuments(m),
    ]);
    return success(res, { data: rows.map((x) => ({ _id: x._id, startTime: x.startTime, endTime: x.endTime, createdAt: x.createdAt, duration: x.duration, peakViewers: x.peakViewers ?? x.audienceCount ?? 0, avgViewers: x.audienceCount || 0, gifts: x.gifts || 0, diamonds: x.coins || 0, comments: x.liveComments || 0, status: x.endTime ? "ended" : "live" })), pagination: pagination(total, page, limit) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.hostGifts = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const page = toInt(req.query.page, 1, 1, 100000), limit = toInt(req.query.limit, 10, 1, 100);
    const { start, end } = resolveRange(req.query);
    const m = { hostId: host._id, type: { $in: ALL_GIFT_TYPES }, createdAt: between(start, end) };
    const [rows, total, byGift, trend, senders] = await Promise.all([
      History.find(m).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select("userId giftId giftCount giftCoin userCoin hostCoin giftImage type feedPostId liveHistoryId createdAt").populate("userId", "name image uniqueId").lean(),
      History.countDocuments(m),
      History.aggregate([{ $match: m }, { $group: { _id: "$giftId", quantity: { $sum: "$giftCount" }, diamonds: { $sum: "$userCoin" }, image: { $first: "$giftImage" } } }, { $sort: { diamonds: -1 } }, { $limit: 12 }, { $lookup: { from: "gifts", localField: "_id", foreignField: "_id", as: "g", pipeline: [{ $project: { name: 1, imageUrl: 1 } }] } }]),
      History.aggregate([{ $match: m }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, gifts: { $sum: "$giftCount" }, diamonds: { $sum: "$userCoin" } } }, { $sort: { _id: 1 } }]),
      History.aggregate([{ $match: m }, { $group: { _id: "$userId", diamonds: { $sum: "$userCoin" }, gifts: { $sum: "$giftCount" } } }, { $sort: { diamonds: -1 } }, { $limit: 5 }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u", pipeline: [{ $project: { name: 1, image: 1, uniqueId: 1 } }] } }]),
    ]);
    return success(res, {
      data: rows.map((x) => ({ _id: x._id, gift: { _id: x.giftId, image: mUrl(x.giftImage) }, sender: x.userId ? { _id: x.userId._id, name: x.userId.name, image: mUrl(x.userId.image), uniqueId: x.userId.uniqueId } : null, quantity: x.giftCount, diamonds: x.userCoin, hostEarned: x.hostCoin, source: x.feedPostId ? "feed" : x.liveHistoryId ? "live" : "other", feedPostId: x.feedPostId || null, liveHistoryId: x.liveHistoryId || null, createdAt: x.createdAt })),
      pagination: pagination(total, page, limit),
      analytics: {
        byGift: byGift.map((x) => ({ giftId: x._id, name: x.g?.[0]?.name || "Gift", image: mUrl(x.g?.[0]?.imageUrl || x.image || ""), quantity: x.quantity, diamonds: x.diamonds })),
        trend: trend.map((x) => ({ date: x._id, gifts: x.gifts, diamonds: x.diamonds })),
        topSenders: senders.map((x) => ({ userId: x._id, name: x.u?.[0]?.name || "User", image: mUrl(x.u?.[0]?.image), uniqueId: x.u?.[0]?.uniqueId || "", diamonds: x.diamonds, gifts: x.gifts })),
      },
    });
  } catch (e) { console.error("ADMIN HOST GIFTS ERROR =>", e); return error(res, e.message, 500); }
};

exports.hostSupporters = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const { start, end } = resolveRange(req.query);
    const limit = toInt(req.query.limit, 10, 1, 50);
    const rows = await History.aggregate([
      { $match: { hostId: host._id, type: { $in: ALL_GIFT_TYPES }, createdAt: between(start, end) } },
      { $group: { _id: "$userId", diamonds: { $sum: "$userCoin" }, gifts: { $sum: "$giftCount" } } },
      { $sort: { diamonds: -1 } }, { $limit: limit },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u", pipeline: [{ $project: { name: 1, image: 1, uniqueId: 1 } }] } },
    ]);
    return success(res, rows.map((x, i) => ({ rank: i + 1, userId: x._id, name: x.u?.[0]?.name || "User", image: mUrl(x.u?.[0]?.image), uniqueId: x.u?.[0]?.uniqueId || "", diamonds: x.diamonds, gifts: x.gifts })));
  } catch (e) { return error(res, e.message, 500); }
};

exports.hostEarnings = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const { start, end, prevStart, prevEnd } = resolveRange(req.query);
    const page = toInt(req.query.page, 1, 1, 100000), limit = toInt(req.query.limit, 10, 1, 100);
    const hid = host._id;
    const bucket = (r) => History.aggregate([
      { $match: { hostId: hid, createdAt: r, type: { $in: [...ALL_GIFT_TYPES, HISTORY_TYPE.PRIVATE_AUDIO_CALL, HISTORY_TYPE.PRIVATE_VIDEO_CALL, HISTORY_TYPE.RANDOM_VIDEO_CALL, HISTORY_TYPE.CHAT_WITH_HOST, HISTORY_TYPE.DAILY_LIVE_TASK_REWARD] } } },
      { $group: { _id: "$type", host: { $sum: "$hostCoin" }, agency: { $sum: "$agencyCoin" }, admin: { $sum: "$adminCoin" } } },
    ]).then((rows) => {
      const o = { live: 0, feed: 0, gift: 0, other: 0, agency: 0, admin: 0, total: 0 };
      rows.forEach((x) => {
        o.agency += x.agency; o.admin += x.admin; o.total += x.host;
        if (x._id === HISTORY_TYPE.GIFT_IN_LIVE) { o.live += x.host; o.gift += x.host; }
        else if (x._id === HISTORY_TYPE.GIFT_IN_FEED) { o.feed += x.host; o.gift += x.host; }
        else if (x._id === HISTORY_TYPE.GIFT_IN_VIDEO_CALL || x._id === HISTORY_TYPE.GIFT_IN_CHAT) o.gift += x.host;
        else o.other += x.host;
      });
      return o;
    });
    const [c, p, trend, wd] = await Promise.all([
      bucket(between(start, end)), bucket(between(prevStart, prevEnd)),
      History.aggregate([{ $match: { hostId: hid, createdAt: between(start, end), hostCoin: { $gt: 0 } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, diamonds: { $sum: "$hostCoin" } } }, { $sort: { _id: 1 } }]),
      History.aggregate([{ $match: { hostId: hid, type: HISTORY_TYPE.WITHDRAW_BY_HOST, createdAt: between(start, end) } }, { $group: { _id: "$payoutStatus", n: { $sum: 1 }, coins: { $sum: "$hostCoin" } } }]),
    ]);
    const txM = { hostId: hid, createdAt: between(start, end), hostCoin: { $gt: 0 } };
    const [tx, total] = await Promise.all([History.find(txM).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select("uniqueId type hostCoin agencyCoin adminCoin userCoin feedPostId liveHistoryId createdAt").lean(), History.countDocuments(txM)]);
    const kind = (t) => (t.feedPostId ? "feed" : t.liveHistoryId ? "live" : "other");
    return success(res, {
      summary: { total: { value: c.total, growth: growth(c.total, p.total) }, live: { value: c.live, growth: growth(c.live, p.live) }, feed: { value: c.feed, growth: growth(c.feed, p.feed) }, gift: { value: c.gift, growth: growth(c.gift, p.gift) }, other: { value: c.other, growth: growth(c.other, p.other) } },
      revenueShare: split({ admin: c.admin, agency: c.agency, host: c.total }),
      trend: trend.map((x) => ({ date: x._id, diamonds: x.diamonds })),
      withdrawals: wd.map((x) => ({ payoutStatus: x._id, count: x.n, coins: x.coins })),
      transactions: tx.map((t) => ({ _id: t._id, uniqueId: t.uniqueId, type: t.type, source: kind(t), host: t.hostCoin, agency: t.agencyCoin, admin: t.adminCoin, createdAt: t.createdAt })),
      pagination: pagination(total, page, limit),
    });
  } catch (e) { console.error("ADMIN HOST EARNINGS ERROR =>", e); return error(res, e.message, 500); }
};

// ---------------- host picker (Host filter dropdown) ----------------
exports.hostOptions = async (req, res) => {
  try {
    const s = String(req.query.search || "").trim().slice(0, 60);
    const m = {};
    if (s) { const rx = new RegExp(esc(s), "i"); m.$or = [{ name: rx }, { uniqueId: rx }]; }
    const hosts = await Host.find(m).sort({ name: 1 }).limit(30).select("name uniqueId image").lean();
    return success(res, hosts.map((h) => ({ _id: h._id, name: h.name, uniqueId: h.uniqueId, image: mUrl(h.image) })));
  } catch (e) { return error(res, e.message, 500); }
};

// ---------------- wallet / KYC / settings tabs ----------------
exports.hostWallet = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    const page = toInt(req.query.page, 1, 1, 100000), limit = toInt(req.query.limit, 10, 1, 100);
    const m = { hostId: host._id, $or: [{ hostCoin: { $gt: 0 } }, { type: HISTORY_TYPE.WITHDRAW_BY_HOST }] };
    const [tx, total, wd] = await Promise.all([
      History.find(m).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select("uniqueId type hostCoin userCoin payoutStatus price createdAt").lean(),
      History.countDocuments(m),
      History.aggregate([{ $match: { hostId: host._id, type: HISTORY_TYPE.WITHDRAW_BY_HOST } }, { $group: { _id: "$payoutStatus", n: { $sum: 1 }, coins: { $sum: "$userCoin" } } }]),
    ]);
    return success(res, {
      balance: host.coin || 0, redeemedCoins: host.redeemedCoins || 0, redeemedAmount: host.redeemedAmount || 0, totalGifts: host.totalGifts || 0,
      withdrawals: wd.map((x) => ({ payoutStatus: x._id, count: x.n, coins: x.coins })),
      data: tx.map((t) => ({ _id: t._id, uniqueId: t.uniqueId, type: t.type, credit: t.type === HISTORY_TYPE.WITHDRAW_BY_HOST ? 0 : t.hostCoin, debit: t.type === HISTORY_TYPE.WITHDRAW_BY_HOST ? t.userCoin : 0, payoutStatus: t.payoutStatus, createdAt: t.createdAt })),
      pagination: pagination(total, page, limit),
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.hostKyc = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    return success(res, {
      identityProofType: host.identityProofType || "", identity: host.identity || "",
      documents: (host.identityProof || []).map((d) => ({ url: mUrl(d), key: d.key })),
      verified: host.status === 2, requestStatus: host.status, reason: host.reason || "",
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.hostSettings = async (req, res) => {
  try {
    const host = await needHost(req, res); if (!host) return;
    return success(res, {
      isBlock: !!host.isBlock, isFake: !!host.isFake, isOnline: !!host.isOnline, isBusy: !!host.isBusy, isLive: !!host.isLive,
      rates: { randomCall: host.randomCallRate || 0, randomCallFemale: host.randomCallFemaleRate || 0, randomCallMale: host.randomCallMaleRate || 0, privateCall: host.privateCallRate || 0, audioCall: host.audioCallRate || 0, chat: host.chatRate || 0 },
      languages: host.language || [], impressions: host.impression || [],
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ================= INTERACTION ACTIVITY OF ONE FEED =================
// kind: likes | comments | shares | views | gifts   (paginated, newest first)
exports.interactions = async (req, res) => {
  try {
    const { id, kind } = req.params;
    if (!isOid(id)) return error(res, "Invalid feed id", 400);
    const page = toInt(req.query.page, 1, 1, 100000), limit = toInt(req.query.limit, 10, 1, 100);
    const pid = new OID(id);
    const U = "name image uniqueId";
    const user = (u) => (u ? { _id: u._id, name: u.name || "User", image: mUrl(u.image), uniqueId: u.uniqueId || "" } : null);
    const model = { likes: FeedLike, comments: FeedComment, shares: FeedShare, views: FeedView }[kind];

    if (kind === "gifts") {
      const m = { feedPostId: pid, type: { $in: FEED_GIFT_TYPES } };
      const [rows, total, sum] = await Promise.all([
        History.find(m).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select("userId giftId giftCount userCoin hostCoin giftImage createdAt").populate("userId", U).lean(),
        History.countDocuments(m), sumGift(m),
      ]);
      const gifts = await require("../../models/gift.model").find({ _id: { $in: rows.map((r) => r.giftId) } }).select("name").lean();
      const gn = new Map(gifts.map((g) => [String(g._id), g.name]));
      return success(res, { summary: { totalGifts: sum.count, totalDiamonds: sum.total, hostIncome: sum.income }, data: rows.map((r) => ({ _id: r._id, user: user(r.userId), gift: { name: gn.get(String(r.giftId)) || "Gift", image: mUrl(r.giftImage) }, quantity: r.giftCount, diamonds: r.userCoin, createdAt: r.createdAt })), pagination: pagination(total, page, limit) });
    }
    if (!model) return error(res, "Invalid interaction type", 400);

    const m = { postId: pid };
    const [rows, total] = await Promise.all([
      model.find(m).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate("userId", U).lean(),
      model.countDocuments(m),
    ]);
    const data = rows.map((r) => ({
      _id: r._id, user: user(r.userId), createdAt: r.createdAt,
      action: { likes: "liked this post", comments: "commented", shares: "shared this post", views: "viewed this post" }[kind],
      ...(kind === "comments" ? { comment: r.comment, status: "visible" } : {}),
    }));
    return success(res, { data, pagination: pagination(total, page, limit) });
  } catch (e) { console.error("ADMIN FEED INTERACTIONS ERROR =>", e); return error(res, e.message, 500); }
};

// moderation: delete one comment (keeps post.comments counter in sync, realtime to app + admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    if (!isOid(id) || !isOid(commentId)) return error(res, "Invalid id", 400);
    const del = await FeedComment.findOneAndDelete({ _id: commentId, postId: id });
    if (!del) return error(res, "Comment not found", 404);
    const post = await FeedPost.findOneAndUpdate({ _id: id, comments: { $gt: 0 } }, { $inc: { comments: -1 } }, { new: true }).lean();
    emitFeedEvent(FEED_EVENTS.COMMENT_DELETED, { feedId: id, hostId: post?.hostId, commentId, action: "delete", updatedCount: post?.comments ?? 0 });
    return success(res, { updatedCount: post?.comments ?? 0 }, "Comment deleted");
  } catch (e) { return error(res, e.message, 500); }
};

// bulk actions: archive | block | unblock | restore | delete   (max 100 ids)
exports.bulk = async (req, res) => {
  try {
    const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter(isOid).slice(0, 100);
    const action = String(req.body?.action || "");
    if (!ids.length) return error(res, "No feeds selected", 400);
    if (!["archive", "block", "unblock", "restore", "delete"].includes(action)) return error(res, "Invalid action", 400);
    const posts = await FeedPost.find({ _id: { $in: ids } }).select("_id hostId").lean();
    if (action === "delete") {
      await Promise.all([FeedPost.deleteMany({ _id: { $in: ids } }), FeedLike.deleteMany({ postId: { $in: ids } }), FeedView.deleteMany({ postId: { $in: ids } }), FeedShare.deleteMany({ postId: { $in: ids } }), FeedComment.deleteMany({ postId: { $in: ids } })]);
    } else {
      const state = action === "archive" ? "archived" : action === "block" ? "blocked" : "active";
      await FeedPost.updateMany({ _id: { $in: ids } }, { moderation: state, status: state === "active" });
    }
    if (action !== "unblock" && action !== "restore") posts.forEach((p) => emitFeedEvent(FEED_EVENTS.DELETED, { feedId: p._id, hostId: p.hostId, action, updatedCount: 0 }));
    else posts.forEach((p) => emitFeedEvent(FEED_EVENTS.CREATED, { feedId: p._id, hostId: p.hostId, action, updatedCount: 1 }));
    return success(res, { affected: posts.length }, "Done");
  } catch (e) { return error(res, e.message, 500); }
};

// admin creates a post on behalf of a host (multipart: hostId, caption, type, files[])
exports.create = async (req, res) => {
  try {
    const { hostId, type } = req.body || {};
    const cap = String(req.body?.caption || "").trim().slice(0, 2200);
    if (!isOid(hostId)) return error(res, "Select a host", 400);
    if (!["image", "video"].includes(type)) return error(res, "Invalid post type", 400);
    if (!req.files?.length) return error(res, "Media files required", 400);
    const host = await Host.findById(hostId).select("_id userId").lean();
    if (!host) return error(res, "Host not found", 404);
    const media = req.files.map((f) => ({ url: f.location || f.path || "", key: f.key || "" }));
    const post = await FeedPost.create({ userId: host.userId, hostId: host._id, caption: cap, type, media });
    emitFeedEvent(FEED_EVENTS.CREATED, { feedId: post._id, hostId: host._id, action: "create", updatedCount: 1 });
    return success(res, { _id: post._id }, "Post created");
  } catch (e) { return error(res, e.message, 500); }
};

// ================= COMPLETE ANALYTICS OF ONE FEED (feed detail page) =================
// daily series of views / likes / comments / shares / gift diamonds + totals of the selected range
exports.analytics = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isOid(id)) return error(res, "Invalid feed id", 400);
    const post = await FeedPost.findById(id).select("_id createdAt").lean();
    if (!post) return error(res, "Feed not found", 404);
    const pid = post._id;
    const q = { ...req.query };
    if (!q.startDate && !q.endDate) { q.startDate = new Date(post.createdAt).toISOString().slice(0, 10); } // default: since the post was published
    const { start, end, prevStart, prevEnd } = resolveRange(q);
    const day = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } };
    const daily = (M) => M.aggregate([{ $match: { postId: pid, createdAt: between(start, end) } }, { $group: { _id: day, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    const count = (M, r) => M.countDocuments({ postId: pid, createdAt: r });
    const [views, likes, comments, shares, gifts, cv, pv, cl, pl, cc, pc, cs, ps, cg, pg] = await Promise.all([
      daily(FeedView), daily(FeedLike), daily(FeedComment), daily(FeedShare),
      History.aggregate([{ $match: { feedPostId: pid, type: { $in: FEED_GIFT_TYPES }, createdAt: between(start, end) } }, { $group: { _id: day, n: { $sum: "$giftCount" }, diamonds: { $sum: "$userCoin" } } }, { $sort: { _id: 1 } }]),
      count(FeedView, between(start, end)), count(FeedView, between(prevStart, prevEnd)),
      count(FeedLike, between(start, end)), count(FeedLike, between(prevStart, prevEnd)),
      count(FeedComment, between(start, end)), count(FeedComment, between(prevStart, prevEnd)),
      count(FeedShare, between(start, end)), count(FeedShare, between(prevStart, prevEnd)),
      sumGift({ feedPostId: pid, type: { $in: FEED_GIFT_TYPES }, createdAt: between(start, end) }),
      sumGift({ feedPostId: pid, type: { $in: FEED_GIFT_TYPES }, createdAt: between(prevStart, prevEnd) }),
    ]);
    // merge all series on one date axis
    const dates = new Set();
    [views, likes, comments, shares, gifts].forEach((a) => a.forEach((x) => dates.add(x._id)));
    const pick = (a) => new Map(a.map((x) => [x._id, x.n]));
    const mv = pick(views), ml = pick(likes), mc = pick(comments), ms = pick(shares), mg = new Map(gifts.map((x) => [x._id, x]));
    const series = [...dates].sort().map((d) => ({ date: d, views: mv.get(d) || 0, likes: ml.get(d) || 0, comments: mc.get(d) || 0, shares: ms.get(d) || 0, gifts: mg.get(d)?.n || 0, diamonds: mg.get(d)?.diamonds || 0 }));
    const card = (c, p) => ({ value: c, previous: p, growth: growth(c, p) });
    res.set("Cache-Control", "no-store");
    return success(res, { range: { start, end }, series, totals: { views: card(cv, pv), likes: card(cl, pl), comments: card(cc, pc), shares: card(cs, ps), gifts: card(cg.count, pg.count), diamonds: card(cg.total, pg.total) } });
  } catch (e) { console.error("ADMIN FEED ANALYTICS ERROR =>", e); return error(res, e.message, 500); }
};
