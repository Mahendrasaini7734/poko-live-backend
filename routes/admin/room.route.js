// ======================================
// EXPRESS
// ======================================

const express = require("express");

const route = express.Router();


// ======================================
// MIDDLEWARE
// ======================================

const checkAccessWithSecretKey =
require("../../checkAccess");


// ======================================
// CONTROLLER
// ======================================

const roomController =
require("../../controllers/admin/room.controller");


// ======================================
// GET ALL ROOMS
// ======================================

route.get(

  "/fetch-room",

  checkAccessWithSecretKey(),

  roomController.getRooms

);


// ======================================
// GET ROOM DETAILS
// ======================================

route.get(

  "/:roomId",

  checkAccessWithSecretKey(),

  roomController.getRoomDetails

);


// ======================================
// GET ROOM PARTICIPANTS
// ======================================

route.get(

  "/:roomId/participants",

  checkAccessWithSecretKey(),

  roomController.getRoomParticipants

);


// ======================================
// FORCE END ROOM
// ======================================

route.patch(

  "/:roomId/end",

  checkAccessWithSecretKey(),

  roomController.forceEndRoom

);


// ======================================
// REMOVE USER
// ======================================

route.patch(

  "/remove-user",

  checkAccessWithSecretKey(),

  roomController.removeUser

);


// ======================================
// MUTE / UNMUTE USER
// ======================================

route.patch(

  "/mute-user",

  checkAccessWithSecretKey(),

  roomController.muteUser

);


// ======================================
// ROOM ANALYTICS
// ======================================

route.get(

  "/analytics/overview",

  checkAccessWithSecretKey(),

  roomController.roomAnalytics

);


// ======================================
// EXPORT
// ======================================

module.exports = route;