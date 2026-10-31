/**
 * Gift on a feed post + report a feed post.
 * Same money rules as live gifts (socket.js liveGift): admin commission from Setting.adminCommissionRate,
 * agency commission from Agency.commissionType/commission, rest to the host.
 * Writes History{type: GIFT_IN_FEED, feedPostId} -> admin Feed Management reads everything from there.
 */
const mongoose = require("mongoose");
const FeedPost = require("../../models/feedPost.model");
const History = require("../../models/history.model");
const Report = require("../../models/report.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const Agency = require("../../models/agency.model");
const Gift = require("../../models/gift.model");
const Block = require("../../models/block.model");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");
const { HISTORY_TYPE } = require("../../types/constant");
const { success, error } = require("../../util/response");
const { FEED_EVENTS, emitFeedEvent } = require("../../services/feedRealtime.service");

const isOid = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);
const r2 = (n) => Number(Number(n).toFixed(2));

// POST /feed/:id/gift   body { giftId, count }
exports.sendGift = async (req, res) => {
  const userId = req.user?.userId;
  const postId = req.params.id;
  try {
    if (!userId) return error(res, "Unauthorized", 401);
    const giftId = String(req.body?.giftId || "");
    const count = Math.floor(Number(req.body?.count) || 1);
    if (!isOid(postId) || !isOid(giftId)) return error(res, "Invalid id", 400);
    if (count < 1 || count > 999) return error(res, "Invalid gift count", 400);

    const post = await FeedPost.findOne({ _id: postId, status: true }).select("_id hostId").lean();
    if (!post) return error(res, "Post not found", 404);

    const [sender, host, gift, blocked] = await Promise.all([
      User.findOne({ _id: userId, isBlock: false }).select("_id coin").lean(),
      Host.findOne({ _id: post.hostId, isBlock: false }).select("_id agencyId userId").lean(),
      Gift.findById(giftId).select("_id coin imageUrl svgaImageUrl type").lean(),
      Block.exists({ $or: [{ userId, hostId: post.hostId }, { userId: post.hostId, hostId: userId }] }).catch(() => null),
    ]);
    if (!sender) return error(res, "User not found", 404);
    if (!host) return error(res, "Host not found", 404);
    if (!gift) return error(res, "Gift not found", 404);
    if (blocked) return error(res, "You cannot gift this post", 403);
    if (host.userId && String(host.userId) === String(userId)) return error(res, "You cannot gift your own post", 400);

    const price = Math.abs(Number(gift.coin || 0));
    if (price <= 0) return error(res, "Invalid gift price", 400);
    const total = price * count;
    if (Number(sender.coin || 0) < total) return error(res, "You don't have enough coins", 400);

    const settings = global.settings || {};
    const adminShare = r2((total * Number(settings.adminCommissionRate ?? 10)) / 100);
    const pool = r2(total - adminShare);
    let agencyShare = 0, hostEarn = pool, agency = null;
    if (host.agencyId && mongoose.isValidObjectId(host.agencyId)) {
      agency = await Agency.findById(host.agencyId).select("_id commissionType commission").lean();
      if (agency && Number(agency.commissionType) === 1) {
        agencyShare = r2((pool * Number(agency.commission || 0)) / 100);
        hostEarn = r2(pool - agencyShare);
      }
    }

    // 1) atomic deduction - fails (and nothing else happens) if coins changed meanwhile
    const deducted = await User.updateOne({ _id: userId, coin: { $gte: total } }, { $inc: { coin: -total, spentCoins: total } });
    if (deducted.modifiedCount !== 1) return error(res, "Insufficient coins", 400);

    try {
      await Host.updateOne({ _id: host._id }, { $inc: { coin: hostEarn, totalGifts: count } });
      if (agency && agencyShare > 0) {
        const agencyTotal = r2(hostEarn + agencyShare);
        await Agency.updateOne({ _id: agency._id }, { $inc: { hostCoins: hostEarn, totalEarnings: agencyShare, netAvailableEarnings: agencyTotal, totalEarningsWithCommissionAndHostCoin: agencyTotal } });
      }
      const h = await History.create({
        uniqueId: await generateHistoryUniqueId(),
        type: HISTORY_TYPE.GIFT_IN_FEED,
        userId, hostId: host._id, agencyId: host.agencyId || null, giftId: gift._id, feedPostId: post._id,
        giftCoin: price, giftCount: count, giftImage: gift.imageUrl || "", giftsvgaImage: gift.svgaImageUrl || "", giftType: gift.type || 1,
        userCoin: total, adminCoin: adminShare, agencyCoin: agencyShare, hostCoin: hostEarn,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      const agg = await History.aggregate([
        { $match: { feedPostId: post._id, type: HISTORY_TYPE.GIFT_IN_FEED } },
        { $group: { _id: null, count: { $sum: "$giftCount" }, income: { $sum: "$hostCoin" } } },
      ]);
      const totals = agg[0] || { count: count, income: hostEarn };
      emitFeedEvent(FEED_EVENTS.GIFTED, { feedId: post._id, hostId: host._id, userId, action: "gift", updatedCount: totals.count, income: totals.income, giftId: gift._id, quantity: count });
      return success(res, { historyId: h._id, giftCount: totals.count, coinsSpent: total, balance: Number(sender.coin) - total }, "Gift sent");
    } catch (inner) {
      // compensate: give the coins back if anything after the deduction failed
      await User.updateOne({ _id: userId }, { $inc: { coin: total, spentCoins: -total } }).catch(() => {});
      throw inner;
    }
  } catch (e) {
    console.error("FEED GIFT ERROR =>", e);
    return error(res, e.message || "Internal Server Error", 500);
  }
};

// POST /feed/:id/report   body { reason }   (one report per user per post)
exports.reportPost = async (req, res) => {
  try {
    const userId = req.user?.userId; const postId = req.params.id;
    if (!userId) return error(res, "Unauthorized", 401);
    if (!isOid(postId)) return error(res, "Invalid postId", 400);
    const reason = String(req.body?.reason || "").trim().slice(0, 300);
    if (!reason) return error(res, "Reason is required", 400);
    const post = await FeedPost.findById(postId).select("_id hostId").lean();
    if (!post) return error(res, "Post not found", 404);
    const dup = await Report.exists({ reporterId: userId, feedPostId: post._id });
    if (dup) return success(res, { alreadyReported: true }, "Already reported");
    await Report.create({ reporterId: userId, reporterRole: "user", targetId: post.hostId, targetRole: "host", feedPostId: post._id, reason });
    return success(res, {}, "Report submitted");
  } catch (e) { return error(res, e.message, 500); }
};
