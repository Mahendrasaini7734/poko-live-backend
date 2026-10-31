//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const LiveBroadcasterController = require("../../controllers/client/liveBroadcaster.controller");

//live host
route.post("/HostStreaming", checkAccessWithSecretKey(), LiveBroadcasterController.HostStreaming);

//live host END (HTTP fallback, idempotent)
route.post("/HostStreamingEnd", checkAccessWithSecretKey(), LiveBroadcasterController.HostStreamingEnd);

//live status (ended-live protection for old notifications / stale lists)
route.get("/LiveStatus", checkAccessWithSecretKey(), LiveBroadcasterController.LiveStatus);

//audience list of a running live (host only)
route.get("/LiveAudience", checkAccessWithSecretKey(), LiveBroadcasterController.LiveAudience);

module.exports = route;
