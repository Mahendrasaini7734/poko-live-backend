const express = require('express');

const router = express.Router();

const controller = require('../../controllers/client/participant.controller');

const validateUserToken = require("../../middleware/validateUserToken.middleware");

const checkRoomOwner = require("../../middleware/checkRoomOwner.middleware");



// ======================================
// ROOM MEMBERS
// ======================================

// all members
router.get(
  '/:id/members',
  validateUserToken,
  controller.getMembers
);

// speakers
router.get(
  '/:id/speakers',
  validateUserToken,
  controller.getSpeakers
);

// audience
router.get(
  '/:id/audience',
  validateUserToken,
  controller.getAudience
);

// seat requests
router.get(
  '/:id/seat-requests',

  // validateUserToken, checkRoomOwner,
  controller.getSeatRequests
);


// ======================================
// SEAT MANAGEMENT
// ======================================

// audience -> speaker
router.post(
  '/take-seat',
  // validateUserToken, checkRoomOwner,
  controller.takeSeat
);

// speaker -> audience
router.post(
  '/leave-seat',
  validateUserToken,
  controller.leaveSeat
);


// ======================================
// HAND RAISE
// ======================================

// raise hand
router.post(
  '/raise-hand',
  validateUserToken,
  controller.raiseHand
);

// lower hand
router.post(
  '/lower-hand',
  validateUserToken, checkRoomOwner,
  controller.lowerHand
);


// ======================================
// MUTE / UNMUTE
// ======================================

// mute user
router.post(
  '/mute-user',
  validateUserToken, checkRoomOwner,
  controller.muteUser
);

// unmute user
router.post(
  '/unmute-user',
  validateUserToken, checkRoomOwner,
  controller.unmuteUser
);


// ======================================
// REMOVE USER
// ======================================

// kick/remove user
router.post(
  '/remove-user',
  validateUserToken,
  checkRoomOwner,
  controller.removeUser
);


module.exports = router;