const Participant = require('../../models/participant.model');
const Room = require('../../models/room.model');
const Host = require('../../models/host.model');
const mongoose = require("mongoose");
const { success, error } = require("../../util/response");

// ======================================
// GET ROOM MEMBERS
// ======================================
exports.getMembers = async (req, res) => {

  try {

    const roomId = req.params.id;

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 20;

    const skip =
      (page - 1) * limit;

    const filter = {

      roomId,

      isActive: true,

    };

    const totalMembers =
      await Participant.countDocuments(
        filter,
      );

    const members =
      await Participant.find(
        filter,
      )

        .populate({

          path: "userId",

          select: `
          name
          image
          uniqueId
          country
          countryFlagImage
          isVip
        `,

        })

        .sort({

          role: 1,

          seatIndex: 1,

        })

        .skip(skip)

        .limit(limit);

    return success(

      res,

      {

        members,

        pagination: {

          total:
            totalMembers,

          page,

          limit,

          totalPages:
            Math.ceil(
              totalMembers /
              limit,
            ),

          hasNext:
            page <
            Math.ceil(
              totalMembers /
              limit,
            ),

          hasPrev:
            page > 1,

        },

      },

      "Members fetched",

    );

  } catch (err) {

    console.log(
      "GET MEMBERS ERROR =>",
      err,
    );

    return error(
      res,
      err.message,
      500,
    );
  }
};



// ======================================
// GET SPEAKERS / ROOM LAYOUT
// ======================================

exports.getSpeakers = async (req, res) => {

  try {


    const roomId = req.params.id;



    const currentUserId =
      req.user?.userId;



    const room = await Room.findById(roomId)
      .populate({
        path: "hostId",
        populate: {
          path: "userId",
          select: `
        _id
        name
        image
        uniqueId
        country
        countryFlagImage
        isVip
        coin
      `,
        },
      });

    if (!room) {

      return error(
        res,
        "Room not found"
      );

    }

    // ======================================
    // FIND CURRENT HOST
    // ======================================

    const currentHost =
      await Host.findOne({

        userId: currentUserId

      });

    // ======================================
    // CHECK ROOM OWNER
    // ======================================

    const isRoomOwner =

      currentHost &&

      room.hostId.toString() ===

      currentHost._id.toString();

    // ======================================
    // GET ACTIVE PARTICIPANTS
    // ======================================

    const participants =
      await Participant.find({

        roomId,

        isActive: true

      })

        .populate({

          path: "userId",

          select: `
          name
          image
          uniqueId
          country
          countryFlagImage
          isVip
          coin
        `

        })

        .lean();

    // ======================================
    // OCCUPIED USERS
    // ======================================

    const occupiedUsers =
      participants.filter(

        (participant) =>

          participant.role === "host" ||

          participant.role === "speaker"

      );

    // ======================================
    // REQUESTED USERS
    // ======================================

    const requestedUsers =
      participants.filter(

        (participant) =>

          participant.isHandRaised === true &&

          participant.requestedSeatIndex !== null

      );

    // ======================================
    // ROOM STATS
    // ======================================

    const totalViews =
      participants.length;

    const totalPendingRequests =
      requestedUsers.length;

    const totalSpeakers =
      occupiedUsers.length;

    const totalAudience =
      participants.filter(

        (participant) =>

          participant.role === "audience"

      ).length;

    // ======================================
    // HOST DETAILS
    // ======================================

    const host = room.hostId
      ? {
        hostId: room.hostId._id,
        userId: room.hostId.userId?._id,
        name: room.hostId.userId?.name,
        image: room.hostId.userId?.image,
        uniqueId: room.hostId.userId?.uniqueId,
        country: room.hostId.userId?.country,
        countryFlagImage: room.hostId.userId?.countryFlagImage,
        coin: room.hostId.userId?.coin,
        isVip: room.hostId.userId?.isVip,
      }
      : null;

    const seats = [];

    for (

      let i = 0;

      i < room.seatLimit;

      i++

    ) {



      const occupiedSeat =
        occupiedUsers.find(

          (participant) =>

            participant.seatIndex === i

        );

      if (occupiedSeat) {

        seats.push({

          seatIndex: i,

          type: "occupied",

          role: occupiedSeat.role,

          isMuted: occupiedSeat.isMuted,

          isHandRaised: false,

          requestedSeatIndex: null,

          user: occupiedSeat.userId

        });

        continue;

      }

      // ======================================
      // REQUESTED SEAT
      // ======================================

      const requestedSeat =
        requestedUsers.find(

          (participant) =>

            participant.requestedSeatIndex === i

        );

      if (requestedSeat) {

        seats.push({

          seatIndex: i,

          type: "requested",

          role: "audience",

          isMuted: false,

          isHandRaised: true,

          requestedSeatIndex: i,

          user: requestedSeat.userId

        });

        continue;

      }

      seats.push({

        seatIndex: i,

        type: "empty",

        role: null,

        isMuted: false,

        isHandRaised: false,

        requestedSeatIndex: null,

        user: null

      });

    }

    // ======================================
    // RESPONSE
    // ======================================

    return success(
      res,
      {
        host,

        isRoomOwner,

        totalViews,

        totalPendingRequests,

        totalSpeakers,

        totalAudience,

        seats,
      },
      "Speakers fetched successfully"
    );

  } catch (err) {

    console.log(

      "GET SPEAKERS ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};


// ======================================
// GET AUDIENCE
// ======================================
exports.getAudience = async (req, res) => {
  try {

    const roomId = req.params.id;

    const audience = await Participant.find({

      roomId,

      role: 'audience'

    });

    return success(
      res,
      audience,
      "Audience fetched successfully"
    );

  } catch (err) {

    console.log("GET AUDIENCE ERROR =>", err);

    return error(res, err.message, 500);

  }
};


// ======================================
// GET SEAT REQUESTS
// ======================================

exports.getSeatRequests = async (req, res) => {
  try {
    const roomId = req.params.id;
    const requests =
      await Participant.find({
        roomId,
        isHandRaised: true,
        requestedSeatIndex: {
          $ne: null
        },
        role: "audience",
        isActive: true

      })
        .populate({
          path: "userId",
          select: `
          name
          image
          uniqueId
          country
          countryFlagImage
          isVip
          coin
        `
        })
        .sort({
          requestedSeatIndex: 1
        })
        .lean();
    return success(
      res,
      requests,
      "Seat requests fetched successfully"
    );
  } catch (err) {
    console.log(
      "GET REQUEST ERROR =>",
      err
    );

    return error(
      res,
      err.message,
      500
    );

  }

};

// ======================================
// TAKE SEAT
// ======================================
exports.takeSeat = async (req, res) => {
  try {

    const {
      roomId,
      userId,
      seatIndex
    } = req.body;

    // ======================================
    // CHECK ROOM
    // ======================================

    const room = await Room.findById(roomId);

    if (!room) {
      return error(res, "Room not found");
    }

    // ======================================
    // CHECK SEAT
    // ======================================

    const seatTaken = await Participant.findOne({

      roomId,

      seatIndex,

      isActive: true

    });

    if (seatTaken) {
      return error(res, "Seat already taken");
    }

    // ======================================
    // CHECK MAX SEATS
    // ======================================

    if (seatIndex > room.seatLimit) {
      return error(res, "Invalid seat");
    }
    const participant = await Participant.findOneAndUpdate(
      {
        roomId,
        userId,
      },
      {
        role: "speaker",

        seatIndex,

        isHandRaised: false,

        requestedSeatIndex: null,

        isMuted: false,
      },
      {
        new: true,
      }
    );

    return success(
      res,
      participant,
      "Seat assigned successfully"
    );

  } catch (err) {

    console.log("TAKE SEAT ERROR =>", err);

    return error(res, err.message, 500);

  }
};


// ======================================
// LEAVE SEAT
// ======================================
exports.leaveSeat = async (req, res) => {
  try {

    const {
      roomId,
      userId
    } = req.body;

    const participant = await Participant.findOneAndUpdate(

      {
        roomId,
        userId
      },

      {

        role: 'audience',

        seatIndex: null,

        isMuted: false

      },

      {
        new: true
      }

    );

    return success(
      res,
      participant,
      "Seat left successfully"
    );

  } catch (err) {

    console.log("LEAVE SEAT ERROR =>", err);

    return error(res, err.message, 500);

  }
};


// ======================================
// RAISE HAND
// ======================================

// ======================================
// RAISE HAND / REQUEST SEAT
// ======================================

exports.raiseHand = async (req, res) => {

  try {

    // ======================================
    // BODY DATA
    // ======================================

    const {

      roomId,

      seatIndex

    } = req.body;

    // ======================================
    // AUTH USER
    // ======================================

    const userId = req.user?.userId;

    if (!userId) {

      return error(
        res,
        "Unauthorized"
      );

    }

    // ======================================
    // VALIDATION
    // ======================================

    if (!roomId) {

      return error(
        res,
        "roomId is required"
      );

    }

    if (

      seatIndex === undefined ||

      seatIndex === null

    ) {

      return error(
        res,
        "seatIndex is required"
      );

    }

    // ======================================
    // CHECK PARTICIPANT
    // ======================================

    const participant =
      await Participant.findOne({

        roomId,

        userId,

        isActive: true

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // HOST/SPEAKER CANNOT REQUEST
    // ======================================

    if (

      participant.role === "host" ||

      participant.role === "speaker"

    ) {

      return error(
        res,
        "Host/Speaker cannot raise hand"
      );

    }

    // ======================================
    // ALREADY REQUESTED
    // ======================================

    if (

      participant.isHandRaised

    ) {

      return error(
        res,
        "You already requested a seat"
      );

    }

    // ======================================
    // CHECK SEAT ALREADY OCCUPIED
    // ======================================

    const occupiedSeat =
      await Participant.findOne({

        roomId,

        seatIndex,

        role: {

          $in: [

            "host",

            "speaker"

          ]

        },

        isActive: true

      });

    if (occupiedSeat) {

      return error(
        res,
        "Seat already occupied"
      );

    }

    // ======================================
    // CHECK SEAT ALREADY REQUESTED
    // ======================================

    const requestedSeat =
      await Participant.findOne({

        roomId,

        requestedSeatIndex:
          seatIndex,

        isHandRaised: true,

        isActive: true

      });

    if (requestedSeat) {

      return error(
        res,
        "Seat already requested"
      );

    }

    // ======================================
    // UPDATE REQUEST
    // ======================================

    participant.isHandRaised = true;

    participant.requestedSeatIndex =
      seatIndex;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      "Seat request sent successfully"

    );

  } catch (err) {
    console.log(
      "RAISE HAND ERROR =>",
      err
    );

    return error(
      res,
      err.message,
      500
    );

  }

};


// ======================================
// LOWER HAND
// ======================================

exports.lowerHand = async (req, res) => {

  try {

    const {

      roomId,

      userId

    } = req.body;

    // ======================================
    // VALIDATION
    // ======================================

    if (!roomId) {

      return error(
        res,
        "roomId is required"
      );

    }

    if (!userId) {

      return error(
        res,
        "userId is required"
      );

    }

    // ======================================
    // FIND PARTICIPANT
    // ======================================

    const participant =
      await Participant.findOne({

        roomId,

        userId,

        isActive: true

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // HAND NOT RAISED
    // ======================================

    if (!participant.isHandRaised) {

      return error(
        res,
        "Hand already lowered"
      );

    }

    // ======================================
    // RESET REQUEST
    // ======================================

    participant.isHandRaised = false;

    participant.requestedSeatIndex = null;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      "Hand lowered successfully"

    );

  } catch (err) {

    console.log(
      "LOWER HAND ERROR =>",
      err
    );

    return error(
      res,
      err.message,
      500
    );

  }

};

// ======================================
// MUTE USER
// ======================================

exports.muteUser = async (req, res) => {

  try {

    const {

      roomId,

      userId

    } = req.body;

    // ======================================
    // FIND PARTICIPANT
    // ======================================

    const participant =
      await Participant.findOne({

        roomId,

        userId,

        isActive: true

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // ONLY UPDATE MUTE
    // ======================================

    participant.isMuted = true;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      "User muted successfully"

    );

  } catch (err) {

    console.log(

      "MUTE USER ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};

// ======================================
// UNMUTE USER
// ======================================

exports.unmuteUser = async (req, res) => {

  try {

    // ======================================
    // BODY
    // ======================================

    const {

      roomId,

      userId

    } = req.body;

    // ======================================
    // VALIDATION
    // ======================================

    if (!roomId) {

      return error(
        res,
        "roomId is required"
      );

    }

    if (!userId) {

      return error(
        res,
        "userId is required"
      );

    }

    // ======================================
    // FIND PARTICIPANT
    // ======================================

    const participant =
      await Participant.findOne({

        roomId,

        userId,

        isActive: true

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // ONLY UPDATE MUTE STATE
    // ======================================

    participant.isMuted = false;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      "User unmuted successfully"

    );

  } catch (err) {

    console.log(

      "UNMUTE USER ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};


// ======================================
// REMOVE USER
// ======================================

exports.removeUser = async (req, res) => {

  try {

    // ======================================
    // BODY DATA
    // ======================================

    const {

      roomId,

      userId

    } = req.body;

    // ======================================
    // VALIDATION
    // ======================================

    if (!roomId) {

      return error(
        res,
        "roomId is required"
      );

    }

    if (!userId) {

      return error(
        res,
        "userId is required"
      );

    }

    // ======================================
    // CHECK PARTICIPANT
    // ======================================

    const participant = await Participant.findOne({

      roomId,

      userId,

      isActive: true

    });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // HOST CANNOT BE REMOVED
    // ======================================

    if (participant.role === "host") {

      return error(
        res,
        "Host cannot be removed"
      );

    }

    // ======================================
    // REMOVE USER
    // ======================================

    participant.isActive = false;

    participant.leftAt = new Date();

    participant.socketId = null;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(
      res,
      {},
      "User removed successfully"
    );

  } catch (err) {
    console.log("REMOVE USER ERROR =>", err);
    return error(res, err.message, 500);

  }

};