const Room = require("../models/room.model");
const Host = require("../models/host.model");

const { success, error } = require("../util/response");


module.exports = async (

  req,

  res,

  next

) => {

  try {

    // ======================================
    // ROOM ID
    // ======================================

    const roomId =

      req.body.roomId ||

      req.params.roomId ||

      req.params.id;

    if (!roomId) {

      return error(
        res,
        "roomId is required"
      );

    }

    // ======================================
    // USER
    // ======================================

    const userId =
      req.user?.userId;

    if (!userId) {

      return error(
        res,
        "Unauthorized"
      );

    }

    // ======================================
    // FIND HOST
    // ======================================

    const host =
      await Host.findOne({

        userId

      });

    if (!host) {

      return error(
        res,
        "Host not found"
      );

    }

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
    // OWNER CHECK
    // ======================================

    if (

      room.hostId.toString() !==

      host._id.toString()

    ) {

      return error(

        res,

        "Only room owner allowed"

      );

    }

    // ======================================
    // NEXT
    // ======================================

    next();

  } catch (err) {

    console.log(

      "CHECK ROOM OWNER ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};