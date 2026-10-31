const Room = require('../../models/room.model');
const Participant = require('../../models/participant.model');
const Host = require('../../models/host.model');

const { success, error } = require("../../util/response");

const generateUid = () => Math.floor(Math.random() * 1000000);
const { buildToken } = require("../../util/agoraToken");

// ======================================
// CREATE ROOM
// ======================================
exports.createRoom = async (req, res) => {
  let uploadedImageKey = null;

  try {
    const {
      name,
      description,
      type = "public",
      seatLimit = 10,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return error(res, "Unauthorized");
    }

    const host = await Host.findOne({
      userId,
    });

    if (!host) {
      return error(res, "Only hosts can create room");
    }

    if (!name || !name.trim()) {
      return error(res, "Room name required");
    }

    const existingRoom = await Room.findOne({
      hostId: host._id,
      status: {
        $in: ["created", "live"],
      },
    });

    if (existingRoom) {
      return error(res, "Host already has active room");
    }

    if (req.file?.key) {
      uploadedImageKey = req.file.key;
    }

    const inviteCode =
      type === "private"
        ? Math.random().toString(36).substring(2, 8)
        : null;

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim() || "",
      image: uploadedImageKey || "",
      type,
      inviteCode,
      hostId: host._id,
      createdBy: userId,
      seatLimit: Number(seatLimit) || 10,
      status: "created",
    });

    await Participant.create({
      roomId: room._id,
      userId,
      role: "host",
      seatIndex: 0,
      agoraUid: generateUid(),
      isActive: true,
    });

    const roomData = room.toObject();

    roomData.image = room.image
      ? `${process.env.MEDIA_BASE_URL}/${room.image}`
      : "";

    return success(
      res,
      roomData,
      "Room created successfully"
    );
  } catch (err) {
    console.error("CREATE ROOM ERROR =>", err.message);

    if (uploadedImageKey) {
      try {
        await deleteFromS3(uploadedImageKey);
      } catch (deleteError) {
        console.error(
          "ROOM IMAGE DELETE FAILED =>",
          deleteError.message
        );
      }
    }

    return error(
      res,
      err.message || "Internal Server Error",
      500
    );
  }
};


// FETCH ROOMS

exports.getRooms = async (req, res) => {
  try {
    const {
      type,
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user?.userId;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    let host = null;

    if (userId) {
      host = await Host.findOne({
        userId,
      }).select("_id");
    }

    const query = {
      $or: [
        {
          status: "live",
        },
      ],
    };

    if (host) {
      query.$or.push({
        hostId: host._id,
      });
    }

    if (type) {
      query.type = type;
    }

    const [rooms, total] = await Promise.all([
      Room.find(query)
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
            `,
          },
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Room.countDocuments(query),
    ]);

    const roomIds = rooms.map((room) => room._id);

    const participants = roomIds.length
      ? await Participant.find({
          roomId: {
            $in: roomIds,
          },
          isActive: true,
        }).lean()
      : [];

    const participantCountMap = {};

    for (const participant of participants) {
      const roomId = participant.roomId.toString();

      participantCountMap[roomId] =
        (participantCountMap[roomId] || 0) + 1;
    }

    const finalRooms = rooms.map((room) => {
      const roomId = room._id.toString();

      const totalViews =
        participantCountMap[roomId] || 0;

      const isRoomOwner =
        room.createdBy?.toString() ===
        userId?.toString();

      const roomData = {
        ...room,
        totalViews,
        isRoomOwner,
      };

      if (roomData.image) {
        roomData.image =
          `${process.env.MEDIA_BASE_URL}/${roomData.image}`;
      } else {
        roomData.image = "";
      }

      if (
        roomData.hostId &&
        roomData.hostId.userId
      ) {
        const hostUser = roomData.hostId.userId;

        if (hostUser.image) {
          if (
            typeof hostUser.image === "string"
          ) {
            hostUser.image =
              hostUser.image.startsWith("http://") ||
              hostUser.image.startsWith("https://")
                ? hostUser.image
                : `${process.env.MEDIA_BASE_URL}/${hostUser.image}`;
          } else if (
            typeof hostUser.image === "object"
          ) {
            const imageUrl =
              hostUser.image.url ||
              hostUser.image.image ||
              hostUser.image.path ||
              "";

            hostUser.image = imageUrl.startsWith(
              "http://"
            ) ||
            imageUrl.startsWith("https://")
              ? imageUrl
              : imageUrl
                ? `${process.env.MEDIA_BASE_URL}/${imageUrl}`
                : "";
          }
        } else {
          hostUser.image = "";
        }
      }

      return roomData;
    });

    return success(res, {
      rooms: finalRooms,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (err) {
    console.error(
      "GET ROOM ERROR =>",
      err.message
    );

    return error(
      res,
      err.message || "Internal Server Error",
      500
    );
  }
};



// START ROOM
exports.startRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;

    if (!roomId || !userId) {
      return error(
        res,
        "Invalid room request",
        400,
      );
    }

    const host = await Host.findOne({
      userId,
    });

    if (!host) {
      return error(
        res,
        "Only hosts can start room",
      );
    }

    const room = await Room.findById(
      roomId,
    );

    if (!room) {
      return error(
        res,
        "Room not found",
        404,
      );
    }

    if (
      room.hostId.toString() !==
      host._id.toString()
    ) {
      return error(
        res,
        "Unauthorized",
        403,
      );
    }

    if (
      room.status === "live"
    ) {
      return error(
        res,
        "Room already live",
      );
    }

    if (
      room.status === "ended"
    ) {
      return error(
        res,
        "Room has already ended",
      );
    }

    room.status = "live";
    room.startedAt = new Date();

    await room.save();

    let participant =
      await Participant.findOne({
        roomId,
        userId,
      });

    if (!participant) {
      participant =
        await Participant.create({
          roomId,
          userId,
          role: "host",
          seatIndex: 0,
          agoraUid: generateUid(),
          isActive: true,
          isMuted: false,
          isHandRaised: false,
          requestedSeatIndex: null,
          leftAt: null,
          socketId: null,
          micEnabled: true,
        });

      console.log(
        "HOST PARTICIPANT CREATED =>",
        userId,
      );
    } else {
      participant.role = "host";
      participant.seatIndex = 0;
      participant.isActive = true;
      participant.isMuted = false;
      participant.isHandRaised = false;
      participant.requestedSeatIndex = null;
      participant.leftAt = null;
      participant.socketId = null;
      participant.micEnabled = true;

      await participant.save();

      console.log(
        "HOST PARTICIPANT UPDATED =>",
        userId,
      );
    }

    const token = buildToken({
      channel: roomId,
      uid: participant.agoraUid,
      role: "publisher",
    });

    console.log(
      "ROOM STARTED =>",
      roomId,
    );

    return success(
      res,
      {
        roomId,
        participantId:
          participant._id,
        agoraUid:
          participant.agoraUid,
        channelName:
          roomId,
        token,
      },
      "Room is LIVE",
    );
  } catch (err) {
    console.log(
      "START ROOM ERROR =>",
      err,
    );

    return error(
      res,
      err.message,
      500,
    );
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;
    const { inviteCode } = req.body;

    if (!roomId || !userId) {
      return error(
        res,
        "Invalid room request",
        400,
      );
    }

    const room = await Room.findById(
      roomId,
    );

    if (!room) {
      return error(
        res,
        "Room not found",
        404,
      );
    }

    if (
      room.status !== "live"
    ) {
      return error(
        res,
        "Room not live",
      );
    }

    if (
      room.type === "private" &&
      room.inviteCode !== inviteCode
    ) {
      return error(
        res,
        "Invalid invite code",
        403,
      );
    }

    let participant =
      await Participant.findOne({
        roomId,
        userId,
      });

    console.log(
      "PARTICIPANT =>",
      participant,
    );

    if (!participant) {
      participant =
        await Participant.create({
          roomId,
          userId,
          role: "audience",
          seatIndex: null,
          agoraUid: generateUid(),
          isActive: true,
          isMuted: false,
          isHandRaised: false,
          requestedSeatIndex: null,
          leftAt: null,
          socketId: null,
          micEnabled: false,
        });

      console.log(
        "PARTICIPANT CREATED =>",
        userId,
      );
    } else {
      participant.role = "audience";
      participant.seatIndex = null;
      participant.isActive = true;
      participant.isMuted = false;
      participant.isHandRaised = false;
      participant.requestedSeatIndex = null;
      participant.leftAt = null;
      participant.socketId = null;
      participant.micEnabled = false;

      await participant.save();

      console.log(
        "PARTICIPANT REJOINED =>",
        userId,
      );
    }

    const token = buildToken({
      channel: roomId,
      uid: participant.agoraUid,
      role: "subscriber",
    });

    return success(
      res,
      {
        roomId,
        participantId:
          participant._id,
        role:
          participant.role,
        agoraUid:
          participant.agoraUid,
        channelName:
          roomId,
        token,
      },
      "Joined successfully",
    );
  } catch (err) {
    console.log(
      "JOIN ROOM ERROR =>",
      err,
    );

    return error(
      res,
      err.message,
      500,
    );
  }
};

// LEAVE ROOM
exports.leaveRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;

    if (!roomId || !userId) {
      return error(
        res,
        "Invalid room request",
        400,
      );
    }

    const participant =
      await Participant.findOne({
        roomId,
        userId,
      });

    if (!participant) {
      return error(
        res,
        "User not in room",
      );
    }

    if (!participant.isActive) {
      return success(
        res,
        {},
        "User already left room",
      );
    }

    if (
      participant.role === "host"
    ) {
      const room =
        await Room.findOneAndUpdate(
          {
            _id: roomId,
            status: "live",
          },
          {
            status: "ended",
            endedAt: new Date(),
          },
          {
            new: true,
          },
        );

      if (!room) {
        return error(
          res,
          "Room not found or already ended",
          404,
        );
      }

      await Participant.updateMany(
        {
          roomId,
        },
        {
          $set: {
            isActive: false,
            leftAt: new Date(),
            socketId: null,
            role: "audience",
            seatIndex: null,
            isMuted: false,
            isHandRaised: false,
            requestedSeatIndex: null,
            micEnabled: false,
          },
        },
      );

      return success(
        res,
        {
          roomId,
        },
        "Room ended by host",
      );
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    participant.socketId = null;
    participant.role = "audience";
    participant.seatIndex = null;
    participant.isMuted = false;
    participant.isHandRaised = false;
    participant.requestedSeatIndex = null;
    participant.micEnabled = false;

    await participant.save();

    return success(
      res,
      {
        roomId,
      },
      "User left room",
    );
  } catch (err) {
    console.log(
      "LEAVE ROOM ERROR =>",
      err,
    );

    return error(
      res,
      err.message,
      500,
    );
  }
};


 
// END ROOM
exports.endRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.userId;

    if (!roomId || !userId) {
      return error(
        res,
        "Invalid room request",
        400,
      );
    }

    const host =
      await Host.findOne({
        userId,
      });

    if (!host) {
      return error(
        res,
        "Only hosts can end room",
      );
    }

    const room =
      await Room.findById(
        roomId,
      );

    if (!room) {
      return error(
        res,
        "Room not found",
        404,
      );
    }

    if (
      room.hostId.toString() !==
      host._id.toString()
    ) {
      return error(
        res,
        "Unauthorized",
        403,
      );
    }

    if (
      room.status === "ended"
    ) {
      return error(
        res,
        "Room already ended",
      );
    }

    room.status = "ended";
    room.endedAt = new Date();

    await room.save();

    await Participant.updateMany(
      {
        roomId,
      },
      {
        $set: {
          isActive: false,
          leftAt: new Date(),
          socketId: null,
          role: "audience",
          seatIndex: null,
          isMuted: false,
          isHandRaised: false,
          requestedSeatIndex: null,
          micEnabled: false,
        },
      },
    );

    return success(
      res,
      {
        roomId,
      },
      "Room ended successfully",
    );
  } catch (err) {
    console.log(
      "END ROOM ERROR =>",
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
// DELETE ROOM
// ======================================
exports.deleteRoom = async (req, res) => {
  try {

    const roomId = req.params.id;

    // ======================================
    // FIND HOST
    // ======================================

    const host = await Host.findOne({
      userId: req.user.userId
    });

    if (!host) {
      return error(res, "Only hosts can delete room");
    }

    // ======================================
    // FIND ROOM
    // ======================================

    const room = await Room.findById(roomId);

    if (!room) {
      return error(res, "Room not found", 404);
    }

    // ======================================
    // VALIDATE OWNER
    // ======================================

    if (room.hostId.toString() !== host._id.toString()) {
      return error(res, "Unauthorized", 403);
    }

    // ======================================
    // LIVE CHECK
    // ======================================

    if (room.status === "live") {
      return error(res, "End room before deleting");
    }

    // ======================================
    // DELETE PARTICIPANTS
    // ======================================

    await Participant.deleteMany({
      roomId
    });

    // ======================================
    // DELETE ROOM
    // ======================================

    await Room.findByIdAndDelete(roomId);

    return success(
      res,
      {},
      "Room deleted successfully"
    );

  } catch (err) {

    console.log("DELETE ROOM ERROR =>", err);

    return error(res, err.message, 500);

  }
};