//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const C = require("../../controllers/admin/liveAnalytics.controller");

// ---- realtime state ----
route.get("/overview", checkAccessWithSecretKey(), C.overview);
route.get("/live-hosts", checkAccessWithSecretKey(), C.liveHosts);
route.get("/live-users", checkAccessWithSecretKey(), C.liveUsers);
route.get("/live-rooms", checkAccessWithSecretKey(), C.liveRooms);
route.get("/live-rooms/:roomId", checkAccessWithSecretKey(), C.liveRoomDetail);
route.get("/live-rooms/:roomId/comments", checkAccessWithSecretKey(), C.roomComments);
route.get("/live-rooms/:roomId/gifts", checkAccessWithSecretKey(), C.roomGifts);
route.get("/live-rooms/:roomId/activity", checkAccessWithSecretKey(), C.roomActivity);
route.get("/activity", checkAccessWithSecretKey(), C.activity);

// ---- admin actions (audited) ----
route.get("/permissions", checkAccessWithSecretKey(), C.permissions);
route.post("/live-rooms/:roomId/end", checkAccessWithSecretKey(), C.endRoom);
route.get("/audit", checkAccessWithSecretKey(), C.audit);

// ---- historical analytics (today | yesterday | week | month | custom) ----
route.get("/users", checkAccessWithSecretKey(), C.users);
route.get("/hosts", checkAccessWithSecretKey(), C.hosts);
route.get("/analytics/rooms", checkAccessWithSecretKey(), C.roomAnalytics);
route.get("/analytics/gifts", checkAccessWithSecretKey(), C.giftAnalytics);
route.get("/analytics/gift-transactions", checkAccessWithSecretKey(), C.giftTransactions);
route.get("/analytics/revenue", checkAccessWithSecretKey(), C.revenueAnalytics);

module.exports = route;
