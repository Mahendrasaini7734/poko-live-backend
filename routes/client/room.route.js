const express = require('express');
const router = express.Router();

const roomController = require('../../controllers/client/room.controller');

const upload = require("../../middleware/upload");
const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");

// ==========================
// ROOM ROUTES
// ==========================

// CREATE ROOM
router.post(
  '/create-room',
  validateUserToken,
  checkAccessWithSecretKey(),
  upload('room').single("image"),
  roomController.createRoom
);

// GET LIVE ROOMS (public)
router.get(
  '/fetch-room',
  validateUserToken,  checkAccessWithSecretKey(),
  roomController.getRooms
);

// START ROOM (host only)
router.post(
  '/:id/start',
  validateUserToken,
  roomController.startRoom
);

// JOIN ROOM
router.post(
  '/:id/join',
  validateUserToken,
  roomController.joinRoom
);

// LEAVE ROOM
router.post(
  '/:id/leave',
  validateUserToken,
  roomController.leaveRoom
);

// END ROOM (host only)
router.post(
  '/:id/end',
  validateUserToken,
  roomController.endRoom
);


// DELETE ROOM (host only)
router.delete(
  '/:id/delete',
  validateUserToken,
  roomController.deleteRoom
);

// // ==========================
// // TOKEN (VERY IMPORTANT)
// // ==========================
// router.get(
//   '/token',
//   validateUserToken,
//   roomController.generateToken
// );

module.exports = router;