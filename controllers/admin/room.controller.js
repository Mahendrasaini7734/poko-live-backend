const mongoose = require("mongoose");

const Room = require("../../models/room.model");
const Host = require("../../models/host.model");
const User = require("../../models/user.model");
const Participant = require("../../models/participant.model");

const { success, error } = require("../../util/response");


// ======================================
// GET ALL ROOMS
// ======================================

exports.getRooms = async (req, res) => {

  try {

    // ======================================
    // QUERY
    // ======================================

    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip =
      (Number(page) - 1) *
      Number(limit);

    // ======================================
    // FILTER
    // ======================================

    const query = {};

    // ======================================
    // STATUS FILTER
    // all / live / created / ended
    // ======================================

    if (

      status &&

      status !== "all"

    ) {

      query.status = status;

    }

    // ======================================
    // FETCH ROOMS
    // ======================================

    const [rooms, total] =
      await Promise.all([

        Room.find(query)

          .populate({

            path: "createdBy",

            select: `
              name
              image
              uniqueId
              isVip
              country
              countryFlagImage
            `

          })

          .sort({

            createdAt: -1

          })

          .skip(skip)

          .limit(Number(limit))

          .lean(),

        Room.countDocuments(query)

      ]);

    // ======================================
    // ROOM IDS
    // ======================================

    const roomIds =
      rooms.map(

        (room) => room._id

      );

    // ======================================
    // PARTICIPANTS
    // ======================================

    const participants =
      await Participant.find({

        roomId: {

          $in: roomIds

        },

        isActive: true

      }).lean();

    // ======================================
    // FINAL ROOMS
    // ======================================

    const finalRooms =
      rooms.map((room) => {

        const roomParticipants =
          participants.filter(

            (participant) =>

              participant.roomId.toString() ===

              room._id.toString()

          );

        return {

          ...room,

          roomOwner:
            room.createdBy || null,

          totalParticipants:
            roomParticipants.length,

          totalSpeakers:

            roomParticipants.filter(

              (participant) =>

                participant.role === "host" ||

                participant.role === "speaker"

            ).length,

          totalAudience:

            roomParticipants.filter(

              (participant) =>

                participant.role === "audience"

            ).length

        };

      });

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        rooms: finalRooms,

        pagination: {

          total,

          page: Number(page),

          limit: Number(limit),

          totalPages:
            Math.ceil(total / limit)

        }

      },

      "Rooms fetched successfully"

    );

  } catch (err) {

    console.log(
      "GET ROOMS ERROR =>",
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
// GET ROOM DETAILS
// ======================================

exports.getRoomDetails = async (req, res) => {

  try {

    // ======================================
    // ROOM ID
    // ======================================

    const roomId =
      req.params.roomId;

    // ======================================
    // FIND ROOM
    // ======================================

    const room =
      await Room.findById(roomId)

      .populate({

        path: "hostId",

        populate: {

          path: "userId",

          select: `
            name
            image
            uniqueId
            isVip
            country
            countryFlagImage
          `

        }

      })

      .lean();

    if (!room) {

      return error(
        res,
        "Room not found"
      );

    }

    // ======================================
    // PARTICIPANTS
    // ======================================

    const participants =
      await Participant.find({

        roomId

      })

      .populate({

        path: "userId",

        select: `
          name
          image
          uniqueId
          isVip
          country
          countryFlagImage
        `

      })

      .lean();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        room,

        totalParticipants:
          participants.filter(

            (participant) =>

              participant.isActive

          ).length,

        totalSpeakers:

          participants.filter(

            (participant) =>

              participant.role === "host" ||

              participant.role === "speaker"

          ).length,

        totalAudience:

          participants.filter(

            (participant) =>

              participant.role === "audience"

          ).length,

        pendingRequests:

          participants.filter(

            (participant) =>

              participant.isHandRaised

          ).length

      },

      "Room details fetched successfully"

    );

  } catch (err) {

    console.log(
      "GET ROOM DETAILS ERROR =>",
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
// GET ROOM PARTICIPANTS
// ======================================

exports.getRoomParticipants = async (req, res) => {

  try {

    // ======================================
    // QUERY
    // ======================================

    const roomId =
      req.params.roomId;

    const {
      role,
      page = 1,
      limit = 20
    } = req.query;

    const skip =
      (Number(page) - 1) *
      Number(limit);

    // ======================================
    // FILTER
    // ======================================

    const query = {

      roomId

    };

    if (role) {
      query.role = role;
    }

    // ======================================
    // FETCH PARTICIPANTS
    // ======================================

    const [participants, total] =
      await Promise.all([

        Participant.find(query)

          .populate({

            path: "userId",

            select: `
              name
              image
              uniqueId
              isVip
              country
              countryFlagImage
              coin
            `

          })

          .sort({

            createdAt: -1

          })

          .skip(skip)

          .limit(Number(limit))

          .lean(),

        Participant.countDocuments(
          query
        )

      ]);

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        participants,

        pagination: {

          total,

          page: Number(page),

          limit: Number(limit),

          totalPages:
            Math.ceil(total / limit)

        }

      },

      "Participants fetched successfully"

    );

  } catch (err) {

    console.log(
      "GET ROOM PARTICIPANTS ERROR =>",
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
// FORCE END ROOM
// ======================================

exports.forceEndRoom = async (req, res) => {

  try {

    // ======================================
    // ROOM ID
    // ======================================

    const roomId =
      req.params.roomId;

    // ======================================
    // FIND ROOM
    // ======================================

    const room =
      await Room.findById(roomId);

    if (!room) {

      return error(
        res,
        "Room not found"
      );

    }

    // ======================================
    // UPDATE ROOM
    // ======================================

    room.status = "ended";

    room.endedAt =
      new Date();

    await room.save();

    // ======================================
    // DEACTIVATE USERS
    // ======================================

    await Participant.updateMany(

      {

        roomId

      },

      {

        isActive: false,

        leftAt: new Date()

      }

    );

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      room,

      "Room ended successfully"

    );

  } catch (err) {

    console.log(
      "FORCE END ROOM ERROR =>",
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
    // BODY
    // ======================================

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
        userId

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // REMOVE USER
    // ======================================

    participant.isActive = false;

    participant.leftAt =
      new Date();

    participant.socketId = null;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      "User removed successfully"

    );

  } catch (err) {

    console.log(
      "REMOVE USER ERROR =>",
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

    // ======================================
    // BODY
    // ======================================

    const {
      roomId,
      userId,
      isMuted = true
    } = req.body;

    // ======================================
    // FIND PARTICIPANT
    // ======================================

    const participant =
      await Participant.findOne({

        roomId,
        userId

      });

    if (!participant) {

      return error(
        res,
        "Participant not found"
      );

    }

    // ======================================
    // UPDATE MUTE
    // ======================================

    participant.isMuted =
      isMuted;

    await participant.save();

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      participant,

      isMuted
        ? "User muted successfully"
        : "User unmuted successfully"

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
// ROOM ANALYTICS
// ======================================

exports.roomAnalytics = async (req, res) => {

  try {

    // ======================================
    // COUNTS
    // ======================================

    const [

      totalRooms,

      liveRooms,

      endedRooms,

      createdRooms,

      totalParticipants,

      activeParticipants

    ] = await Promise.all([

      Room.countDocuments(),

      Room.countDocuments({

        status: "live"

      }),

      Room.countDocuments({

        status: "ended"

      }),

      Room.countDocuments({

        status: "created"

      }),

      Participant.countDocuments(),

      Participant.countDocuments({

        isActive: true

      })

    ]);

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        totalRooms,

        liveRooms,

        endedRooms,

        createdRooms,

        totalParticipants,

        activeParticipants

      },

      "Room analytics fetched successfully"

    );

  } catch (err) {

    console.log(
      "ROOM ANALYTICS ERROR =>",
      err
    );

    return error(
      res,
      err.message,
      500
    );

  }

};