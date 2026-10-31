const Chat = require("../../models/chat.model");
const Block = require("../../models/block.model");

const moment = require("moment-timezone");
const ChatTopic = require("../../models/chatTopic.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const History = require("../../models/history.model");
const Agency = require("../../models/agency.model");
const mongoose = require("mongoose");
const admin = require("../../util/privateKey");
const { deleteFiles } = require("../../util/deletefile");
const { getMediaUrl,
  getMediaKey,
  getMediaObject, } = require("../../util/media");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");


const formatS3Object = (fileKey) => {
  if (!fileKey) return { url: "", key: "" };
  if (typeof fileKey === "object") return fileKey;

  return {
    key: fileKey,
    url: typeof getMediaUrl === "function" ? getMediaUrl(fileKey) : fileKey,
  };
};


//send message ( image or audio ) ( user )
exports.pushChatMessage = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access.",
      });
    }

    const { chatTopicId, receiverId, messageType } = req.body;
    const type = Number(messageType);

    if (
      !chatTopicId ||
      !receiverId ||
      ![2, 3].includes(type) ||
      !req.files
    ) {
      if (req.files) deleteFiles(req.files);

      return res.status(200).json({
        status: false,
        message: "Invalid details.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(chatTopicId)
    ) {
      if (req.files) deleteFiles(req.files);

      return res.status(200).json({
        status: false,
        message: "Invalid ID.",
      });
    }

    const imageFiles = req.files?.image || [];
    const audioFiles = req.files?.audio || [];

    if (type === 2) {
      if (
        imageFiles.length !== 1 ||
        audioFiles.length > 0
      ) {
        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Only one image can be sent at a time.",
        });
      }
    }

    if (type === 3) {
      if (
        audioFiles.length !== 1 ||
        imageFiles.length > 0
      ) {
        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Only one audio file can be sent at a time.",
        });
      }
    }

    const senderId = new mongoose.Types.ObjectId(
      req.user.userId
    );

    const receiverObjectId =
      new mongoose.Types.ObjectId(receiverId);

    const topicObjectId =
      new mongoose.Types.ObjectId(chatTopicId);

    const [
      uniqueId,
      sender,
      receiver,
      chatTopic,
    ] = await Promise.all([
      generateHistoryUniqueId(),

      User.findOne({
        _id: senderId,
        isBlock: false,
      })
        .select("_id name image coin spentCoins")
        .lean(),

      Host.findOne({
        _id: receiverObjectId,
        isBlock: false,
      })
        .select(
          "_id name image fcmToken chatRate agencyId"
        )
        .lean(),

      ChatTopic.findById(topicObjectId)
        .select(
          "_id senderId receiverId chatId messageCount"
        )
        .lean(),
    ]);

    if (!sender || !receiver || !chatTopic) {
      if (req.files) deleteFiles(req.files);

      return res.status(200).json({
        status: false,
        message: "Sender, receiver or chat topic not found.",
      });
    }

    if (
      chatTopic.senderId.toString() !==
        sender._id.toString() ||
      chatTopic.receiverId.toString() !==
        receiver._id.toString()
    ) {
      if (req.files) deleteFiles(req.files);

      return res.status(200).json({
        status: false,
        message: "Invalid chat topic.",
      });
    }

    const blocked = await Block.findOne({
      userId: sender._id,
      hostId: receiver._id,
      $or: [
        {
          blockedBy: "user",
          blockedType: "host",
        },
        {
          blockedBy: "host",
          blockedType: "user",
        },
      ],
    })
      .select("_id")
      .lean();

    if (blocked) {
      if (req.files) deleteFiles(req.files);

      return res.status(200).json({
        status: false,
        message:
          "You cannot send message because user is blocked.",
      });
    }

    const chatRate = type === 2 ? 12 : 16;

    const freeMessages = Number(
      settingJSON.maxFreeChatMessages ?? 10
    );

    const adminRate = Number(
      settingJSON.adminCommissionRate ?? 10
    );

    const isFree =
      Number(chatTopic.messageCount || 0) <
      freeMessages;

    let deductedCoins = 0;
    let adminShare = 0;
    let hostEarnings = 0;
    let agencyShare = 0;

    if (!isFree) {
      deductedCoins = chatRate;

      if (Number(sender.coin || 0) < deductedCoins) {
        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Insufficient coins.",
        });
      }

      adminShare = Number(
        (
          deductedCoins *
          adminRate /
          100
        ).toFixed(2)
      );

      hostEarnings = Number(
        (
          deductedCoins -
          adminShare
        ).toFixed(2)
      );

      if (
        receiver.agencyId &&
        mongoose.Types.ObjectId.isValid(
          receiver.agencyId
        )
      ) {
        const agency = await Agency.findById(
          receiver.agencyId
        )
          .select(
            "_id commissionType commission"
          )
          .lean();

        if (
          agency &&
          Number(agency.commissionType) === 1
        ) {
          agencyShare = Number(
            (
              hostEarnings *
              Number(agency.commission || 0) /
              100
            ).toFixed(2)
          );

          hostEarnings = Number(
            (
              hostEarnings -
              agencyShare
            ).toFixed(2)
          );
        }
      }
    }

    const chat = new Chat({
      chatTopicId: chatTopic._id,
      senderId: sender._id,
      messageType: type,
      message: "",
      image: {
        key: "",
        url: "",
      },
      audio: {
        key: "",
        url: "",
      },
      date: new Date().toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Kolkata",
        }
      ),
    });

    if (type === 2) {
      const file = imageFiles[0];
      const key =
        file?.key ||
        file?.path ||
        "";

      if (!key) {
        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Image file not found.",
        });
      }

      chat.image = getMediaObject(key);
      chat.message = "";
    }

    if (type === 3) {
      const file = audioFiles[0];
      const key =
        file?.key ||
        file?.path ||
        "";

      if (!key) {
        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Audio file not found.",
        });
      }

      chat.audio = getMediaObject(key);
      chat.message = "";
    }

    await chat.save();

    await ChatTopic.updateOne(
      {
        _id: chatTopic._id,
      },
      {
        $set: {
          chatId: chat._id,
        },
        $inc: {
          messageCount: 1,
        },
      }
    );

    if (deductedCoins > 0) {
      const userUpdate =
        await User.updateOne(
          {
            _id: sender._id,
            coin: {
              $gte: deductedCoins,
            },
          },
          {
            $inc: {
              coin: -deductedCoins,
              spentCoins: deductedCoins,
            },
          }
        );

      if (userUpdate.modifiedCount !== 1) {
        await Chat.deleteOne({
          _id: chat._id,
        });

        await ChatTopic.updateOne(
          {
            _id: chatTopic._id,
          },
          {
            $inc: {
              messageCount: -1,
            },
          }
        );

        if (req.files) deleteFiles(req.files);

        return res.status(200).json({
          status: false,
          message: "Insufficient coins.",
        });
      }

      await Host.updateOne(
        {
          _id: receiver._id,
        },
        {
          $inc: {
            coin: hostEarnings,
          },
        }
      );

      if (
        receiver.agencyId &&
        agencyShare > 0
      ) {
        const agencyTotal =
          Number(
            (
              hostEarnings +
              agencyShare
            ).toFixed(2)
          );

        await Agency.updateOne(
          {
            _id: receiver.agencyId,
          },
          {
            $inc: {
              hostCoins: hostEarnings,
              totalEarnings: agencyShare,
              netAvailableEarnings:
                agencyTotal,
              totalEarningsWithCommissionAndHostCoin:
                agencyTotal,
            },
          }
        );
      }

      await History.create({
        uniqueId,
        type: 9,
        userId: sender._id,
        hostId: receiver._id,
        agencyId:
          receiver.agencyId || null,
        userCoin: deductedCoins,
        hostCoin: hostEarnings,
        adminCoin: adminShare,
        agencyCoin: agencyShare,
        date: new Date().toLocaleString(
          "en-US",
          {
            timeZone: "Asia/Kolkata",
          }
        ),
      });
    }

    const realtimeChat =
      await Chat.findById(
        chat._id
      ).lean();

    const io = global.io;

    if (io) {
      const eventData = {
        ...realtimeChat,
        _id: realtimeChat._id.toString(),
        chatTopicId:
          realtimeChat.chatTopicId.toString(),
        senderId:
          realtimeChat.senderId.toString(),
        receiverId:
          receiver._id.toString(),
      };

      const senderRoom =
        `globalRoom:${chatTopic.senderId}`;

      const receiverRoom =
        `globalRoom:${chatTopic.receiverId}`;

      io.in(senderRoom).emit(
        "chatMessageReceived",
        eventData
      );

      io.in(receiverRoom).emit(
        "chatMessageReceived",
        eventData
      );
    }

    if (
      receiver.fcmToken &&
      receiver.fcmToken.trim()
    ) {
      try {
        const senderImage =
          getMediaUrl(
            sender?.image?.url ||
            sender?.image ||
            ""
          );

        const senderName =
          String(
            sender?.name?.trim() ||
            "User"
          );

        const notificationTitle =
          `${senderName} sent you a message`;

        const notificationBody =
          type === 2
            ? "📷 Sent an image"
            : "🎤 Sent an audio message";

        await admin.messaging.send({
          token: receiver.fcmToken,
          data: {
            title:
              notificationTitle,

            body:
              notificationBody,

            type: "CHAT",

            senderId:
              sender._id.toString(),

            receiverId:
              receiver._id.toString(),

            chatTopicId:
              chatTopic._id.toString(),

            messageId:
              chat._id.toString(),

            senderName:
              senderName,

            senderRole:
              "user",

            receiverRole:
              "host",

            senderImage:
              String(senderImage),

            image:
              String(senderImage),

            messageType:
              String(type),

            message:
              type === 2
                ? "📷 Sent an image"
                : "🎤 Sent an audio message",

            screen:
              "chat",
          },
        });
      } catch (error) {
        console.error(
          "FCM Error:",
          error.message
        );
      }
    }

    return res.status(200).json({
      status: true,
      message: "Message sent successfully.",
      chat: realtimeChat,
    });
  } catch (error) {
    if (req.files) {
      try {
        deleteFiles(req.files);
      } catch (_) {}
    }

    console.error(
      "pushChatMessage Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// GET CHAT HISTORY - USER
exports.fetchChatHistory = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const { receiverId } = req.query;

    if (
      !receiverId ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    const start = Math.max(
      parseInt(req.query.start, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 20,
        1
      ),
      100
    );

    const senderId =
      new mongoose.Types.ObjectId(
        req.user.userId
      );

    const receiverObjectId =
      new mongoose.Types.ObjectId(
        receiverId
      );

    const [
      receiver,
      foundChatTopic,
    ] = await Promise.all([
      Host.findOne({
        _id: receiverObjectId,
        isBlock: false,
      })
        .select(
          "_id audioCallRate privateCallRate"
        )
        .lean(),

      ChatTopic.findOne({
        $or: [
          {
            senderId,
            receiverId: receiverObjectId,
          },
          {
            senderId: receiverObjectId,
            receiverId: senderId,
          },
        ],
      })
        .select(
          "_id senderId receiverId chatId messageCount"
        )
        .lean(),
    ]);

    if (!receiver) {
      return res.status(200).json({
        status: false,
        message: "Receiver not found.",
      });
    }

    let chatTopic = foundChatTopic;

    if (!chatTopic) {
      chatTopic = await ChatTopic.create({
        senderId,
        receiverId: receiver._id,
        messageCount: 0,
      });
    }

    await Chat.updateMany(
      {
        chatTopicId: chatTopic._id,
        isRead: false,
        senderId: {
          $ne: senderId,
        },
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    const skip =
      (start - 1) * limit;

    const chatHistory =
      await Chat.find({
        chatTopicId: chatTopic._id,
      })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit + 1)
        .lean();

    const hasMore =
      chatHistory.length > limit;

    const chats =
      hasMore
        ? chatHistory.slice(0, limit)
        : chatHistory;

    const formattedChatHistory =
      chats.map((chat) => {
        const formattedChat = {
          ...chat,
        };

        let finalDate = null;

        if (chat.createdAt) {
          const createdDate =
            new Date(chat.createdAt);

          if (
            !isNaN(
              createdDate.getTime()
            )
          ) {
            finalDate = createdDate;
          }
        }

        if (!finalDate && chat.date) {
          const chatDate =
            new Date(chat.date);

          if (
            !isNaN(
              chatDate.getTime()
            )
          ) {
            finalDate = chatDate;
          }
        }

        formattedChat.date =
          finalDate
            ? finalDate.toISOString()
            : "";

        if (formattedChat._id) {
          formattedChat._id =
            formattedChat._id.toString();
        }

        if (
          formattedChat.chatTopicId
        ) {
          formattedChat.chatTopicId =
            formattedChat.chatTopicId.toString();
        }

        if (
          formattedChat.senderId
        ) {
          formattedChat.senderId =
            formattedChat.senderId.toString();
        }

        return formattedChat;
      });

    return res.status(200).json({
      status: true,

      message:
        "Chat history retrieved successfully.",

      chatTopic:
        chatTopic._id.toString(),

      chat:
        formattedChatHistory,

      pagination: {
        start,
        limit,
        nextStart:
          hasMore
            ? start + 1
            : null,
        hasMore,
      },

      callRate: {
        privateCallRate:
          Number(
            receiver.privateCallRate || 0
          ),

        audioCallRate:
          Number(
            receiver.audioCallRate || 0
          ),
      },
    });

  } catch (error) {
    console.error(
      "fetchChatHistory Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

//send message ( image or audio ) ( host )
// HOST -> USER CHAT MESSAGE
exports.submitChatMessage = async (req, res) => {
  try {
    if (
      !req.body.senderId ||
      !req.body.chatTopicId ||
      !req.body.receiverId ||
      !req.body.messageType
    ) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(req.body.senderId) ||
      !mongoose.Types.ObjectId.isValid(req.body.receiverId) ||
      !mongoose.Types.ObjectId.isValid(req.body.chatTopicId)
    ) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "Invalid senderId, receiverId or chatTopicId.",
      });
    }

    const messageType = Number(
      req.body.messageType
    );

    if (![1, 2, 3, 4].includes(messageType)) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "messageType must be passed valid.",
      });
    }

    const imageFiles =
      req.files?.image || [];

    const audioFiles =
      req.files?.audio || [];

    if (messageType === 2) {
      if (
        imageFiles.length !== 1 ||
        audioFiles.length > 0
      ) {
        if (req.files) {
          deleteFiles(req.files);
        }

        return res.status(200).json({
          status: false,
          message:
            "Only one image can be sent at a time.",
        });
      }
    }

    if (messageType === 3) {
      if (
        audioFiles.length !== 1 ||
        imageFiles.length > 0
      ) {
        if (req.files) {
          deleteFiles(req.files);
        }

        return res.status(200).json({
          status: false,
          message:
            "Only one audio file can be sent at a time.",
        });
      }
    }

    const senderId =
      new mongoose.Types.ObjectId(
        req.body.senderId
      );

    const receiverId =
      new mongoose.Types.ObjectId(
        req.body.receiverId
      );

    const chatTopicId =
      new mongoose.Types.ObjectId(
        req.body.chatTopicId
      );

    const [
      sender,
      receiver,
      chatTopic,
    ] = await Promise.all([
      Host.findOne({
        _id: senderId,
        isBlock: false,
      })
        .select(
          "_id name image isFake"
        )
        .lean(),

      User.findOne({
        _id: receiverId,
        isBlock: false,
      })
        .select(
          "_id name image fcmToken isBlock"
        )
        .lean(),

      ChatTopic.findOne({
        _id: chatTopicId,
      })
        .select(
          "_id chatId senderId receiverId"
        )
        .lean(),
    ]);

    if (!sender) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "Sender does not found.",
      });
    }

    if (!receiver) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "Receiver does not found.",
      });
    }

    if (!chatTopic) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "ChatTopic does not found.",
      });
    }

    const validTopic =
      (
        chatTopic.senderId.toString() ===
          sender._id.toString() &&
        chatTopic.receiverId.toString() ===
          receiver._id.toString()
      ) ||
      (
        chatTopic.senderId.toString() ===
          receiver._id.toString() &&
        chatTopic.receiverId.toString() ===
          sender._id.toString()
      );

    if (!validTopic) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "Invalid chat topic.",
      });
    }

    const existingBlock =
      await Block.findOne({
        userId: receiver._id,
        hostId: sender._id,
        $or: [
          {
            blockedBy: "user",
            blockedType: "host",
          },
          {
            blockedBy: "host",
            blockedType: "user",
          },
        ],
      })
        .select("_id")
        .lean();

    if (existingBlock) {
      if (req.files) {
        deleteFiles(req.files);
      }

      return res.status(200).json({
        status: false,
        message:
          "You cannot send message because this user is blocked.",
      });
    }

    const chat = new Chat({
      chatTopicId:
        chatTopic._id,

      senderId:
        sender._id,

      messageType,

      message: "",

      image: {
        key: "",
        url: "",
      },

      audio: {
        key: "",
        url: "",
      },

      date: new Date(),
    });

    // TEXT
    if (messageType === 1) {
      chat.message =
        req.body.message || "";
    }

    // IMAGE
    if (messageType === 2) {
      const imageKey =
        imageFiles[0]?.key ||
        imageFiles[0]?.path ||
        req.body.image ||
        "";

      if (!imageKey) {
        if (req.files) {
          deleteFiles(req.files);
        }

        return res.status(200).json({
          status: false,
          message:
            "Image file is required.",
        });
      }

      chat.message = "📸 Image";

      chat.image =
        formatS3Object(imageKey);

      chat.audio = {
        key: "",
        url: "",
      };
    }

    // AUDIO
    if (messageType === 3) {
      const audioKey =
        audioFiles[0]?.key ||
        audioFiles[0]?.path ||
        req.body.audio ||
        "";

      if (!audioKey) {
        if (req.files) {
          deleteFiles(req.files);
        }

        return res.status(200).json({
          status: false,
          message:
            "Audio file is required.",
        });
      }

      chat.message = "🎤 Audio";

      chat.audio =
        formatS3Object(audioKey);

      chat.image = {
        key: "",
        url: "",
      };
    }

    // GIFT
    if (messageType === 4) {
      chat.message =
        req.body.message ||
        "🎁 Gift";

      chat.giftType =
        req.body.giftType || 0;

      chat.giftCount =
        req.body.giftCount || 0;

      chat.giftImage =
        formatS3Object(
          req.body.giftImage
        );

      chat.giftsvgaImage =
        formatS3Object(
          req.body.giftsvgaImage
        );
    }

    await chat.save();

    await ChatTopic.updateOne(
      {
        _id: chatTopic._id,
      },
      {
        $set: {
          chatId: chat._id,
        },
      }
    );

    const responseChat =
      chat.toObject();

    // ==============================
    // REALTIME CHAT
    // ==============================

    const io = global.io;

    if (io) {
      const eventData = {
        ...responseChat,

        _id:
          chat._id.toString(),

        chatTopicId:
          chat.chatTopicId.toString(),

        senderId:
          chat.senderId.toString(),

        receiverId:
          receiver._id.toString(),
      };

      const senderRoom =
        `globalRoom:${sender._id}`;

      const receiverRoom =
        `globalRoom:${receiver._id}`;

      io.in(senderRoom).emit(
        "chatMessageReceived",
        eventData
      );

      if (
        senderRoom !==
        receiverRoom
      ) {
        io.in(receiverRoom).emit(
          "chatMessageReceived",
          eventData
        );
      }
    }

    // ==============================
    // USER PUSH NOTIFICATION
    // ==============================

    if (
      receiver.fcmToken &&
      typeof receiver.fcmToken ===
        "string" &&
      receiver.fcmToken.trim()
    ) {
      let notificationBody =
        `🗨️ ${chat.message}`;

      if (messageType === 2) {
        notificationBody =
          "📷 Sent an image";
      }

      if (messageType === 3) {
        notificationBody =
          "🎤 Sent an audio message";
      }

      if (messageType === 4) {
        notificationBody =
          "🎁 Sent a gift";
      }

      try {
        await admin.messaging.send({
          token:
            receiver.fcmToken,

          data: {
            title:
              `${sender.name || "Host"} sent you a message 📩`,

            body:
              notificationBody,

            type: "CHAT",

            senderId:
              sender._id.toString(),

            receiverId:
              receiver._id.toString(),

            chatTopicId:
              chatTopic._id.toString(),

            messageId:
              chat._id.toString(),

            senderRole:
              "host",

            receiverRole:
              "user",

            messageType:
              String(messageType),

            isFakeSender:
              String(
                Boolean(
                  sender.isFake
                )
              ),
          },
        });
      } catch (fcmError) {
        if (
          fcmError.code ===
            "messaging/registration-token-not-registered" ||
          fcmError.code ===
            "messaging/invalid-registration-token"
        ) {
          try {
            await User.updateOne(
              {
                _id: receiver._id,
                fcmToken:
                  receiver.fcmToken,
              },
              {
                $set: {
                  fcmToken: null,
                },
              }
            );
          } catch (_) {}
        }
      }
    }

    return res.status(200).json({
      status: true,
      message:
        "Message sent successfully.",
      chat: responseChat,
    });

  } catch (error) {
    if (req.files) {
      try {
        deleteFiles(req.files);
      } catch (_) {}
    }

    console.error(
      "submitChatMessage Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

//get old chat ( host )
exports.retrieveChatHistory = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
    } = req.query;

    if (!senderId || !receiverId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid senderId or receiverId.",
      });
    }

    const start = Math.max(
      parseInt(req.query.start || "1", 10),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit || "20", 10),
        1
      ),
      100
    );

    const senderObjectId =
      new mongoose.Types.ObjectId(senderId);

    const receiverObjectId =
      new mongoose.Types.ObjectId(receiverId);

    const chatTopic =
      await ChatTopic.findOne({
        $or: [
          {
            senderId: senderObjectId,
            receiverId: receiverObjectId,
          },
          {
            senderId: receiverObjectId,
            receiverId: senderObjectId,
          },
        ],
      })
        .select(
          "_id senderId receiverId chatId messageCount"
        )
        .lean();

    if (!chatTopic) {
      return res.status(200).json({
        status: true,
        message:
          "Chat history retrieved successfully.",
        chatTopic: null,
        total: 0,
        totalPages: 0,
        start,
        limit,
        hasMore: false,
        nextStart: null,
        chat: [],
      });
    }

    const chatFilter = {
      chatTopicId: chatTopic._id,
    };

    const total =
      await Chat.countDocuments(chatFilter);

    const skip =
      (start - 1) * limit;

    const chats =
      await Chat.find(chatFilter)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit + 1)
        .lean();

    const hasMore =
      chats.length > limit;

    const chatHistory =
      hasMore
        ? chats.slice(0, limit)
        : chats;

    await Chat.updateMany(
      {
        chatTopicId: chatTopic._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    const isValidUrl = (value) => {
      return (
        typeof value === "string" &&
        (
          value.startsWith("http://") ||
          value.startsWith("https://")
        )
      );
    };

    const getLegacyMedia = (
      chat,
      type
    ) => {
      if (
        !chat?.message ||
        !isValidUrl(chat.message)
      ) {
        return {
          key: "",
          url: "",
        };
      }

      const isImage =
        /\.(jpg|jpeg|png|gif|webp|heic)(\?.*)?$/i.test(
          chat.message
        );

      const isAudio =
        /\.(mp3|m4a|aac|wav|ogg|webm)(\?.*)?$/i.test(
          chat.message
        );

      if (
        type === "image" &&
        isImage
      ) {
        return getMediaObject(
          chat.message
        );
      }

      if (
        type === "audio" &&
        isAudio
      ) {
        return getMediaObject(
          chat.message
        );
      }

      return {
        key: "",
        url: "",
      };
    };

    const formatMedia = (
      media,
      chat,
      type
    ) => {
      if (
        media &&
        (
          media.key ||
          media.url
        )
      ) {
        const formatted =
          getMediaObject(media);

        if (
          formatted &&
          (
            formatted.key ||
            formatted.url
          )
        ) {
          return formatted;
        }
      }

      return getLegacyMedia(
        chat,
        type
      );
    };

    const formattedChatHistory =
      chatHistory.map((chat) => {
        const formattedChat = {
          ...chat,

          image: {
            key: "",
            url: "",
          },

          audio: {
            key: "",
            url: "",
          },

          giftImage: {
            key: "",
            url: "",
          },

          giftsvgaImage: {
            key: "",
            url: "",
          },
        };

        let finalDate = null;

        if (chat.createdAt) {
          const createdDate =
            new Date(chat.createdAt);

          if (
            !isNaN(
              createdDate.getTime()
            )
          ) {
            finalDate = createdDate;
          }
        }

        if (!finalDate && chat.date) {
          const chatDate =
            new Date(chat.date);

          if (
            !isNaN(
              chatDate.getTime()
            )
          ) {
            finalDate = chatDate;
          }
        }

        formattedChat.date =
          finalDate
            ? finalDate.toISOString()
            : "";

        if (formattedChat._id) {
          formattedChat._id =
            formattedChat._id.toString();
        }

        if (
          formattedChat.chatTopicId
        ) {
          formattedChat.chatTopicId =
            formattedChat.chatTopicId.toString();
        }

        if (
          formattedChat.senderId
        ) {
          formattedChat.senderId =
            formattedChat.senderId.toString();
        }

        const messageType =
          Number(chat.messageType);

        if (messageType === 2) {
          formattedChat.image =
            formatMedia(
              chat.image,
              chat,
              "image"
            );

          formattedChat.message =
            "📸 Image";
        }

        if (messageType === 3) {
          formattedChat.audio =
            formatMedia(
              chat.audio,
              chat,
              "audio"
            );

          formattedChat.message =
            "🎤 Audio";
        }

        if (chat.giftImage) {
          formattedChat.giftImage =
            formatMedia(
              chat.giftImage,
              chat,
              "gift"
            );
        }

        if (chat.giftsvgaImage) {
          formattedChat.giftsvgaImage =
            formatMedia(
              chat.giftsvgaImage,
              chat,
              "gift"
            );
        }

        return formattedChat;
      });

    return res.status(200).json({
      status: true,

      message:
        "Chat history retrieved successfully.",

      chatTopic:
        chatTopic._id.toString(),

      total,

      totalPages:
        Math.ceil(total / limit),

      start,

      limit,

      hasMore,

      nextStart:
        hasMore
          ? start + 1
          : null,

      chat:
        formattedChatHistory,
    });

  } catch (error) {
    console.error(
      "retrieveChatHistory Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};
