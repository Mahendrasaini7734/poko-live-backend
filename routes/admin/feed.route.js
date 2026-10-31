//express
const express = require("express");

const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const feedController =
    require("../../controllers/admin/feed.controller");


// ======================================
// FEED USERS
// ======================================

route.get(
    "/feed-users", checkAccessWithSecretKey(), feedController.getFeedUsers);


// ======================================
// FEEDS BY USER
// ======================================

route.get(

    "/feeds-by-user/:userId",

    checkAccessWithSecretKey(),

    feedController.getFeedsByUser

);


// ======================================
// DELETE FEED
// ======================================

route.delete(

    "/delete-feed/:postId",

    checkAccessWithSecretKey(),

    feedController.deleteFeed

);

// ======================================
// FEED MANAGEMENT + HOST PROFILE & PERFORMANCE (admin dashboard)
// order matters: static paths before "/management/:id"
// ======================================
const M = require("../../controllers/admin/feedManagement.controller");
const A = checkAccessWithSecretKey();

route.get("/management/stats", A, M.stats);
route.get("/management/list", A, M.list);
route.get("/management/host-options", A, M.hostOptions);
route.post("/management/bulk", A, M.bulk);
route.post("/management/create", A, require("../../middleware/upload")("feed").array("media", 10), M.create);
route.get("/management/host/:hostId/profile", A, M.hostProfile);
route.get("/management/host/:hostId/trends", A, M.hostTrends);
route.get("/management/host/:hostId/feeds", A, M.hostFeeds);
route.get("/management/host/:hostId/live-history", A, M.hostLiveHistory);
route.get("/management/host/:hostId/gifts", A, M.hostGifts);
route.get("/management/host/:hostId/supporters", A, M.hostSupporters);
route.get("/management/host/:hostId/earnings", A, M.hostEarnings);
route.get("/management/host/:hostId/wallet", A, M.hostWallet);
route.get("/management/host/:hostId/kyc", A, M.hostKyc);
route.get("/management/host/:hostId/settings", A, M.hostSettings);
route.patch("/management/:id/status", A, M.setModeration);
route.patch("/management/:id/caption", A, M.updateCaption);
route.get("/management/:id/interactions/:kind", A, M.interactions);
route.get("/management/:id/analytics", A, M.analytics);
route.delete("/management/:id/comments/:commentId", A, M.deleteComment);
route.get("/management/:id", A, M.detail);

module.exports = route;