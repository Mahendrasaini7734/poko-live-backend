//express
const express = require("express");
const route = express.Router();

//validate admin's access token
const validateAdminToken = require("../../middleware/verifyAdminAuthToken.middleware");

//require admin's route.js
const admin = require("./admin.route");
const setting = require("./setting.route");
const impression = require("./impression.route");
const giftCategory = require("./giftCategory.route");
const gift = require("./gift.route");
const vipPlanPrivilege = require("./vipPlanPrivilege.route");
const host = require("./host.route");
const dashboard = require("./dashboard.route");
const agency = require("./agency.route");
const block = require("./block.route");
const user = require("./user.route");
const followerFollowing = require("./followerFollowing.route");
const coinPlan = require("./coinPlan.route");
const vipPlan = require("./vipPlan.route");
const identityProof = require("./identityProof.route");
const paymentMethod = require("./paymentMethod.route");
const history = require("./history.route");
const dailyRewardCoin = require("./dailyRewardCoin.route");
const liveBroadcastHistory = require("./liveBroadcastHistory.route");
const currency = require("./currency.route");
const withdrawalRequest = require("./withdrawalRequest.route");
const notification = require("./notification.route");
const message = require("./message.route");
const role = require("./role.route");
const subAdmin = require("./subAdmin.route");
const reportReason = require("./reportReason.route");
const report = require("./report.route");
// const banner = require("./banner.routes");
const login = require("./login.route");
const feed = require("./feed.route");
const room = require("./room.route");
const liveAnalytics = require("./liveAnalytics.route");

//exports admin's route.js
route.use("/admin", admin);
// route.use("/banner",validateAdminToken, banner);
route.use("/setting", validateAdminToken, setting);
route.use("/impression", validateAdminToken, impression);
route.use("/giftCategory", validateAdminToken, giftCategory);
route.use("/gift", validateAdminToken, gift);
route.use("/vipPlanPrivilege", validateAdminToken, vipPlanPrivilege);
route.use("/host", validateAdminToken, host);
route.use("/dashboard", validateAdminToken, dashboard);
route.use("/agency", validateAdminToken, agency);
route.use("/block", validateAdminToken, block);
route.use("/user", validateAdminToken, user);
route.use("/followerFollowing", validateAdminToken, followerFollowing);
route.use("/coinPlan", validateAdminToken, coinPlan);
route.use("/vipPlan", validateAdminToken, vipPlan);
route.use("/identityProof", validateAdminToken, identityProof);
route.use("/paymentMethod", validateAdminToken, paymentMethod);
route.use("/history", validateAdminToken, history);
route.use("/dailyRewardCoin", validateAdminToken, dailyRewardCoin);
route.use("/liveBroadcastHistory", validateAdminToken, liveBroadcastHistory);
route.use("/currency", validateAdminToken, currency);
route.use("/withdrawalRequest", validateAdminToken, withdrawalRequest);
route.use("/notification", validateAdminToken, notification);
route.use("/message", message);
route.use("/login", login);
route.use("/feed", validateAdminToken, feed); // was unauthenticated apart from the secret key
route.use("/room", room);
route.use("/live-analytics", validateAdminToken, liveAnalytics);
route.use("/role", validateAdminToken, role);
route.use("/subAdmin", validateAdminToken, subAdmin);
route.use("/reportReason", validateAdminToken, reportReason);
route.use("/report", validateAdminToken, report);



module.exports = route;
