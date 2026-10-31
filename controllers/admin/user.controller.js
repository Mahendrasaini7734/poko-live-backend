const User = require("../../models/user.model");
const History = require("../../models/history.model");

const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

//get users


// ---- shared by Users / Hosts management lists (IST calendar days, escaped search, presence filters) ----
const { escapeRegex, TZ: APP_TZ } = require("../../util/dateRange");
const momentTz = require("moment-timezone");
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** createdAt / lastActiveAt range from YYYY-MM-DD params in the application timezone; legacy "All" -> no filter; invalid -> {error} */
const dayRange = (from, to) => {
  if (!from || !to || from === "All" || to === "All") return {};
  if (DAY_RE.test(from) && DAY_RE.test(to)) {
    const a = momentTz.tz(from, "YYYY-MM-DD", true, APP_TZ).startOf("day"), b = momentTz.tz(to, "YYYY-MM-DD", true, APP_TZ).endOf("day");
    if (!a.isValid() || !b.isValid() || a.isAfter(b)) return { error: "Invalid date range" };
    return { range: { $gte: a.toDate(), $lte: b.toDate() } };
  }
  const a = new Date(from), b = new Date(to); // legacy callers (ISO strings)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return { error: "Invalid date range" };
  b.setHours(23, 59, 59, 999);
  return { range: { $gte: a, $lte: b } };
};
const idList = (q) => String(q || "").split(",").filter((x) => /^[a-f0-9]{24}$/i.test(x)).slice(0, 100);

exports.retrieveUserList = async (req, res) => {
  try {
    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const searchString = String(req.query.search || "").trim().slice(0, 80);
    const created = dayRange(req.query.startDate, req.query.endDate);
    if (created.error) return res.status(200).json({ status: false, message: created.error });
    const active = dayRange(req.query.lastActiveFrom, req.query.lastActiveTo);
    if (active.error) return res.status(200).json({ status: false, message: active.error });

    const dateFilterQuery = created.range ? { createdAt: created.range } : {};
    const filter = { ...dateFilterQuery };
    if (searchString && searchString !== "All") {
      const rx = new RegExp(escapeRegex(searchString), "i");
      filter.$or = [{ name: rx }, { email: rx }, { uniqueId: rx }];
    }
    // optional filters (all combinable)
    // the Users page sends isVip / isBlock / isOnline / isBusy / isHost / country (booleans as "true"/"false");
    // the newer params online=online|offline, status=active|blocked, vip=true are accepted as well
    const bool = (v) => (v === "true" ? true : v === "false" ? false : undefined);
    const onlineQ = req.query.online === "online" ? true : req.query.online === "offline" ? false : bool(req.query.isOnline);
    if (onlineQ === true) filter.isOnline = true;
    else if (onlineQ === false) filter.isOnline = { $ne: true };
    const blockQ = req.query.status === "active" ? false : req.query.status === "blocked" ? true : bool(req.query.isBlock);
    if (blockQ !== undefined) filter.isBlock = blockQ;
    const vipQ = req.query.vip === "true" ? true : bool(req.query.isVip);
    if (vipQ === true) filter.isVip = true; else if (vipQ === false) filter.isVip = { $ne: true };
    const busyQ = bool(req.query.isBusy);
    if (busyQ === true) filter.isBusy = true; else if (busyQ === false) filter.isBusy = { $ne: true };
    const hostQ = bool(req.query.isHost);
    if (hostQ === true) filter.isHost = true; else if (hostQ === false) filter.isHost = { $ne: true };
    if (req.query.country && String(req.query.country).length <= 60) filter.country = new RegExp(`^${escapeRegex(String(req.query.country).trim())}$`, "i");
    if (active.range) filter.lastActiveAt = active.range;

    const SORTS = { createdAt: "createdAt", lastActiveAt: "lastActiveAt", coin: "coin", name: "name" };
    const sortKey = SORTS[req.query.sortBy] || "createdAt";
    const sortDir = req.query.order === "asc" ? 1 : -1;

    const [totalActiveUsers, totalVIPUsers, totalMaleUsers, totalFemaleUsers, totalOnlineUsers, totalUsers, users] = await Promise.all([
      User.countDocuments({ isBlock: false, ...dateFilterQuery }),
      User.countDocuments({ isVip: true, ...dateFilterQuery }),
      User.countDocuments({ gender: "male", ...dateFilterQuery }),
      User.countDocuments({ gender: "female", ...dateFilterQuery }),
      User.countDocuments({ isOnline: true }), // presence is always "right now", never date scoped
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $sort: { [sortKey]: sortDir, _id: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        { $lookup: { from: "followerfollowings", localField: "_id", foreignField: "followerId", as: "followings" } },
        { $lookup: { from: "followerfollowings", let: { id: "$hostId" }, pipeline: [{ $match: { $expr: { $and: [{ $ne: ["$$id", null] }, { $eq: ["$followingId", "$$id"] }] } } }, { $count: "n" }], as: "followersOfHost" } },
        {
          $project: {
            _id: 1, uniqueId: 1, name: 1, email: 1, image: 1, countryFlagImage: 1, country: 1, gender: 1, coin: 1, rechargedCoins: 1,
            isHost: 1, isVip: 1, isBlock: 1, isOnline: 1, isBusy: 1, loginType: 1, createdAt: 1, lastActiveAt: 1, lastlogin: 1,
            totalFollowings: { $size: "$followings" },
            totalFollowers: { $ifNull: [{ $arrayElemAt: ["$followersOfHost.n", 0] }, 0] },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true, message: "Retrieved real users!",
      totalActiveUsers, totalVIPUsers, totalMaleUsers, totalFemaleUsers, totalOnlineUsers,
      total: totalUsers, data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// KPI cards of the Users module (same definitions as the list: presence = right now, registrations = createdAt in range)
exports.userSummary = async (req, res) => {
  try {
    const created = dayRange(req.query.startDate, req.query.endDate);
    if (created.error) return res.status(200).json({ status: false, message: created.error });
    const dateQ = created.range ? { createdAt: created.range } : {};
    const [total, online, blocked, vip, newRegistrations] = await Promise.all([
      User.estimatedDocumentCount(), User.countDocuments({ isOnline: true }), User.countDocuments({ isBlock: true }),
      User.countDocuments({ isVip: true }), User.countDocuments(dateQ),
    ]);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "User summary", data: { total, online, active: total - blocked, blocked, vip, newRegistrations } });
  } catch (e) { return res.status(500).json({ status: false, error: e.message }); }
};

// current presence of specific users (admin list patches ONLY these rows when a presence event arrives)
exports.userPresence = async (req, res) => {
  try {
    const ids = idList(req.query.ids);
    const rows = ids.length ? await User.find({ _id: { $in: ids } }).select("_id isOnline isBusy isHost isBlock isVip lastActiveAt").lean() : [];
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "Presence", data: rows });
  } catch (e) { return res.status(500).json({ status: false, error: e.message }); }
};

//toggle user's block status
exports.modifyUserBlockStatus = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const user = await User.findById(userId).select("uniqueId name image countryFlagImage country gender coin rechargedCoins isHost isVip isBlock isFake loginType createdAt");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    user.isBlock = !user.isBlock;
    await user.save();

    return res.status(200).json({
      status: true,
      message: `User has been ${user.isBlock ? "blocked" : "unblocked"} successfully.`,
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "An error occurred while updating user block status." });
  }
};

//get user's profile
exports.fetchUserProfile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const [user] = await Promise.all([
      User.findOne({ _id: userId }).select("name selfIntro gender bio age image email countryFlagImage country loginType uniqueId coin spentCoins rechargedCoins isOnline").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    return res.status(200).json({ status: true, message: "The user has retrieved their profile.", user: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//admin can add or deduct coins from a user's wallet
exports.updateUserCoin = async (req, res, next) => {
  try {
    const { userId, coin, action } = req.body;

    if (!userId || !coin || !action) {
      return res.status(400).json({
        status: false,
        message: "userId, coin, and action are required fields.",
      });
    }

    if (!["add", "deduct"].includes(action)) {
      return res.status(400).json({
        status: false,
        message: "Invalid action. Must be 'add' or 'deduct'.",
      });
    }

    if (isNaN(coin) || coin <= 0) {
      return res.status(400).json({
        status: false,
        message: "Coin must be a positive number.",
      });
    }

    const [uniqueId, user] = await Promise.all([generateHistoryUniqueId(), User.findById(userId).lean()]);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    let newCoinBalance = user.coin;
    let updatedFields = {};

    if (action === "add") {
      newCoinBalance += coin;
      updatedFields = {
        coin: newCoinBalance,
        rechargedCoins: (user.rechargedCoins || 0) + coin,
      };
    } else {
      if (user.coin < coin) {
        return res.status(400).json({
          status: false,
          message: "Insufficient balance to deduct coins.",
        });
      }
      newCoinBalance -= coin;
      updatedFields = {
        coin: newCoinBalance,
      };
    }

    const [, adminHistory] = await Promise.all([
      User.findByIdAndUpdate(userId, updatedFields, { new: true }).lean(),
      History.create({
        uniqueId: uniqueId,
        type: action === "add" ? 14 : 15,
        userId,
        userCoin: coin,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    // if this user is a host with an open app, push the new History row (best effort)
    try {
      const hostDoc = await require("../../models/host.model").findOne({ userId }).select("_id").lean();
      if (hostDoc) require("../../services/dailyTask.service").emitHostHistoryEntry(hostDoc._id, adminHistory._id);
    } catch (e) {
      console.error("Admin coin history realtime emit failed:", e.message);
    }

    return res.status(200).json({
      status: true,
      message: `Successfully ${action === "add" ? "added" : "deducted"} ${coin} coins.`,
    });
  } catch (error) {
    console.error("Admin Coin Update Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
