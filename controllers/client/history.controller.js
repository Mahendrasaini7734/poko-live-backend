const History = require("../../models/history.model");
const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const Gift = require("../../models/gift.model");

//generateHistoryUniqueId
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

const mongoose = require("mongoose");

//get coin history ( user )
exports.getCoinTransactionRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Access denied. Invalid authentication token.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (start - 1) * limit;

    let dateFilterQuery = {};

    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (
        !isNaN(startDateObj.getTime()) &&
        !isNaN(endDateObj.getTime())
      ) {
        endDateObj.setHours(23, 59, 59, 999);

        dateFilterQuery = {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        };
      }
    }

    const transactionHistory = await History.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          type: { $nin: [5] },
          userId: userId,
          userCoin: { $ne: 0 },
        },
      },
      {
        $lookup: {
          from: "hosts",
          localField: "hostId",
          foreignField: "_id",
          as: "receiver",
        },
      },
      {
        $unwind: {
          path: "$receiver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          typeDescription: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$type", 1] },
                  then: "Login Bonus",
                },
                {
                  case: { $eq: ["$type", 2] },
                  then: "Live Gift",
                },
                {
                  case: { $eq: ["$type", 3] },
                  then: "Video Call Gift",
                },
                {
                  case: { $eq: ["$type", 6] },
                  then: "Daily Check-in Reward",
                },
                {
                  case: { $eq: ["$type", 7] },
                  then: "Purchased Coin Plan",
                },
                {
                  case: { $eq: ["$type", 8] },
                  then: "VIP Plan Purchase",
                },
                {
                  case: { $eq: ["$type", 9] },
                  then: "Chat with Host",
                },
                {
                  case: { $eq: ["$type", 10] },
                  then: "Chat Gift",
                },
                {
                  case: { $eq: ["$type", 11] },
                  then: "Private Audio Call",
                },
                {
                  case: { $eq: ["$type", 12] },
                  then: "Private Video Call",
                },
                {
                  case: { $eq: ["$type", 13] },
                  then: "Random Video Call",
                },
                {
                  case: { $eq: ["$type", 14] },
                  then: "Coin Transaction",
                },
                {
                  case: { $eq: ["$type", 15] },
                  then: "Coin Transaction",
                },
              ],
              default: "Unknown Type",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          typeDescription: 1,
          giftCoin: 1,
          giftCount: 1,
          userCoin: 1,
          payoutStatus: 1,
          createdAt: 1,
          receiverName: {
            $ifNull: ["$receiver.name", ""],
          },
          receiverUniqueId: {
            $ifNull: ["$receiver.uniqueId", ""],
          },
          isIncome: {
            $in: ["$type", [1, 6, 7, 8, 14]],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
          _id: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    console.log("ddddd", transactionHistory);
    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

//get coin history ( host )
// ---------------------------------------------------------------------------
// Host history (Settings -> History): ONE centralized list for every coin/reward activity.
//
//  hostId-based rows  (host wallet)  : gifts, calls, chat, withdraw, DAILY LIVE TASK reward
//  userId-based rows  (host's user)  : coin plan, login bonus, daily check-in, admin add/deduct
//
// The host is ALWAYS resolved from the authenticated user. A hostId sent by the client is never
// trusted (a different hostId is rejected), so one host can never read another host's history.
// ---------------------------------------------------------------------------
const HOST_WALLET_TYPES = [2, 3, 5, 9, 10, 11, 12, 13, 16];
const USER_WALLET_TYPES = [1, 6, 7, 14, 15];
const HOST_EXPENSE_TYPES = [5, 15];

const HISTORY_META = {
  1: { key: "LOGIN_BONUS", label: "Login Bonus" },
  2: { key: "LIVE_GIFT", label: "Live Gift" },
  3: { key: "VIDEO_CALL_GIFT", label: "Video Call Gift" },
  5: { key: "WITHDRAWAL", label: "Withdrawal by Host" },
  6: { key: "DAILY_CHECK_IN_REWARD", label: "Daily Check-in Reward" },
  7: { key: "COIN_PLAN_PURCHASE", label: "Purchased Coin Plan" },
  9: { key: "CHAT_WITH_HOST", label: "Chat with Host" },
  10: { key: "CHAT_GIFT", label: "Chat Gift" },
  11: { key: "PRIVATE_AUDIO_CALL", label: "Private Audio Call" },
  12: { key: "PRIVATE_VIDEO_CALL", label: "Private Video Call" },
  13: { key: "RANDOM_VIDEO_CALL", label: "Random Video Call" },
  14: { key: "ADMIN_ADD_COIN", label: "Admin Added Coins" },
  15: { key: "ADMIN_DEDUCT_COIN", label: "Admin Removed Coins" },
  16: { key: "DAILY_TASK_REWARD", label: "Daily Task Completed" },
};

const buildHostHistoryMatch = (hostId, hostUserId, dateFilterQuery = {}) => ({
  ...dateFilterQuery,
  $or: [
    { hostId, hostCoin: { $ne: 0 }, type: { $in: HOST_WALLET_TYPES } },
    { userId: hostUserId, type: { $in: USER_WALLET_TYPES }, userCoin: { $ne: 0 } },
  ],
});

const hostHistoryProjection = () => [
  {
    $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "sender" },
  },
  { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      typeDescription: {
        $switch: {
          branches: Object.entries(HISTORY_META).map(([t, m]) => ({
            case: { $eq: ["$type", Number(t)] },
            then: m.label,
          })),
          default: "Unknown Type",
        },
      },
      historyType: {
        $switch: {
          branches: Object.entries(HISTORY_META).map(([t, m]) => ({
            case: { $eq: ["$type", Number(t)] },
            then: m.key,
          })),
          default: "OTHER",
        },
      },
      // user-wallet rows carry userCoin, host-wallet rows carry hostCoin
      calculatedHostCoin: {
        $cond: [{ $in: ["$type", USER_WALLET_TYPES] }, { $ifNull: ["$userCoin", 0] }, { $ifNull: ["$hostCoin", 0] }],
      },
      isSenderRow: { $in: ["$type", [2, 3, 9, 10, 11, 12, 13]] },
    },
  },
  {
    $project: {
      _id: 1,
      uniqueId: 1,
      type: 1,
      typeDescription: 1,
      historyType: 1,
      reason: { $ifNull: ["$reason", ""] },
      giftCoin: 1,
      giftCount: 1,
      userCoin: 1,
      hostCoin: "$calculatedHostCoin",
      bonusCoins: 1,
      price: 1,
      paymentGateway: 1,
      payoutStatus: 1,
      createdAt: 1, // authoritative server timestamp (UTC) - the app converts it to local time in ONE place
      senderName: { $cond: ["$isSenderRow", { $ifNull: ["$sender.name", ""] }, ""] },
      senderUniqueId: { $cond: ["$isSenderRow", { $ifNull: ["$sender.uniqueId", ""] }, ""] },
      isIncome: { $not: [{ $in: ["$type", HOST_EXPENSE_TYPES] }] },
    },
  },
];

// Shape used by the HTTP response AND the realtime `hostHistoryUpdate` event.
exports.getHostHistoryEntryById = async (historyId, hostId, hostUserId) => {
  const rows = await History.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(String(historyId)), ...buildHostHistoryMatch(hostId, hostUserId) } },
    ...hostHistoryProjection(),
  ]);
  return rows[0] || null;
};

exports.retrieveHostCoinHistory = async (req, res) => {
  try {
    const authUserId = req.user && req.user.userId;
    if (!authUserId) return res.status(401).json({ status: false, message: "Unauthorized" });

    // host comes from the token, never from the query string
    const host = await Host.findOne({ userId: authUserId }).select("_id userId coin").lean();
    if (!host) return res.status(200).json({ status: false, message: "Host does not exist." });

    if (req.query.hostId && String(req.query.hostId) !== String(host._id)) {
      return res.status(403).json({ status: false, message: "You cannot access another host's history." });
    }

    const hostId = new mongoose.Types.ObjectId(host._id);
    const hostUserId = new mongoose.Types.ObjectId(host.userId);

    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (start - 1) * limit;

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        endDateObj.setHours(23, 59, 59, 999);
        dateFilterQuery = { createdAt: { $gte: startDateObj, $lte: endDateObj } };
      }
    }

    const rows = await History.aggregate([
      { $match: buildHostHistoryMatch(hostId, hostUserId, dateFilterQuery) },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit + 1 }, // one extra row tells us whether another page exists
      ...hostHistoryProjection(),
    ]);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      hostId: String(host._id),
      hostCoin: host.coin,
      page: start,
      limit,
      hasMore,
      data,
    });
  } catch (error) {
    console.error("retrieveHostCoinHistory Error:", error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//coin deduct for fake content
exports.handleCoinTransaction = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) return res.status(200).json({ status: false, message: "Transaction type is required." });

    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    if (type === "chatGift") {
      const { senderId, receiverId, giftId, giftCount } = req.body;

      if (!senderId || !receiverId || !giftId || !giftCount) {
        return res.status(200).json({ status: false, message: "Missing required fields for chatGift" });
      }

      if (giftId && !mongoose.Types.ObjectId.isValid(giftId)) {
        return res.status(200).json({ status: false, message: "Invalid giftId. Please provide a valid ObjectId." });
      }

      const [uniqueId, sender, receiver, gift] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(senderId).lean().select("_id name coin"),
        Host.findById(receiverId).lean().select("_id coin totalGifts"),
        Gift.findById(giftId).lean().select("_id coin image svgaImage type"),
      ]);

      if (!sender || !gift) return res.status(404).json({ status: false, message: "Invalid sender/receiver/gift" });

      const count = Number(giftCount);
      const totalCoin = gift.coin * count;

      if (sender.coin < totalCoin) return res.status(200).json({ status: false, message: "Insufficient coins" });

      await Promise.all([
        User.updateOne({ _id: sender._id }, { $inc: { coin: -totalCoin, spentCoins: totalCoin } }),
        History.create({
          uniqueId,
          type: 10,
          userId: sender._id,
          hostId: receiver._id,
          giftId: gift._id,
          giftCoin: gift.coin,
          giftImage: gift.image,
          giftsvgaImage: gift.svgaImage,
          giftType: gift.type,
          giftCount: count,
          userCoin: totalCoin,
          hostCoin: totalCoin,
          adminCoin: 0,
          agencyCoin: 0,
          date: now,
        }),
      ]);

      return res.status(200).json({ success: true, message: "Chat gift sent successfully" });
    } else if (type === "liveGift") {
      const { senderId, receiverId, giftId, giftCount } = req.body;

      if (!senderId || !receiverId || !giftId || !giftCount) return res.status(200).json({ status: false, message: "Missing required fields for liveGift" });

      if (giftId && !mongoose.Types.ObjectId.isValid(giftId)) {
        return res.status(200).json({ status: false, message: "Invalid giftId. Please provide a valid ObjectId." });
      }

      const [uniqueId, sender, receiver, gift] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(senderId).lean().select("_id coin"),
        Host.findById(receiverId).lean().select("_id coin totalGifts"),
        Gift.findById(giftId).lean().select("_id coin image type svgaImage"),
      ]);

      if (!sender || !receiver || !gift) return res.status(404).json({ status: false, message: "Invalid sender/receiver/gift" });

      const count = Number(giftCount);
      const totalCoin = gift.coin * count;

      if (sender.coin < totalCoin) return res.status(200).json({ status: false, message: "Insufficient coins" });

      await Promise.all([
        User.updateOne({ _id: sender._id }, { $inc: { coin: -totalCoin, spentCoins: totalCoin } }),
        History.create({
          uniqueId,
          type: 2,
          userId: sender._id,
          hostId: receiver._id,
          giftId: gift._id,
          giftCoin: gift.coin,
          giftImage: gift.image,
          giftsvgaImage: gift.svgaImage,
          giftType: gift.type,
          giftCount: count,
          userCoin: totalCoin,
          hostCoin: totalCoin,
          adminCoin: 0,
          agencyCoin: 0,
          date: now,
        }),
      ]);

      return res.status(200).json({ success: true, message: "Live gift sent successfully" });
    } else {
      return res.status(200).json({ status: false, message: "Invalid transaction type" });
    }
  } catch (error) {
    console.error("[handleCoinTransaction]status:false, message:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
