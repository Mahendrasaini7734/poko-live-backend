const ChatTopic = require("../../models/chatTopic.model");
const Host = require("../../models/host.model");
const Chat = require("../../models/chat.model");

const { getMediaUrl, getMediaUrls } = require("../../util/media");
const mongoose = require("mongoose");
const { getDisplayName } = require("../../util/hostDisplay");

//get chat thumb list ( user )
exports.fetchChatList = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access.",
      });
    }

    const host = await Host.findOne({
      userId: req.user.userId,
    }).select("_id name");

    const isHost = !!host;

    const targetObjectId = isHost
      ? host._id
      : new mongoose.Types.ObjectId(req.user.userId);

    const start = req.query.start
      ? parseInt(req.query.start)
      : 1;

    const limit = req.query.limit
      ? parseInt(req.query.limit)
      : 20;

    const chatList = await ChatTopic.aggregate([
      {
        $match: {
          chatId: { $ne: null },
          $or: [
            { senderId: targetObjectId },
            { receiverId: targetObjectId },
          ],
        },
      },
      {
        $addFields: {
          otherUserId: {
            $cond: [
              { $eq: ["$senderId", targetObjectId] },
              "$receiverId",
              "$senderId",
            ],
          },
        },
      },
      {
        $lookup: {
          from: isHost ? "users" : "hosts",
          localField: "otherUserId",
          foreignField: "_id",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          profile: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chatId",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $sort: {
          "chat.createdAt": -1,
        },
      },
      {
        $group: {
          _id: "$_id",

          senderId: {
            $first: "$senderId",
          },

          receiverId: {
            $first: "$receiverId",
          },

          otherUserId: {
            $first: "$otherUserId",
          },

          chatTopic: {
            $first: "$chat.chatTopicId",
          },

          name: {
            $first: "$profile.name",
          },

          image: {
            $first: "$profile.image",
          },

          gender: {
            $first: "$profile.gender",
          },

          country: {
            $first: "$profile.country",
          },

          countryFlagImage: {
            $first: "$profile.countryFlagImage",
          },

          isOnline: {
            $first: "$profile.isOnline",
          },

          isFake: {
            $first: "$profile.isFake",
          },

          message: {
            $first: "$chat.message",
          },

          messageType: {
            $first: "$chat.messageType",
          },

          isRead: {
            $first: "$chat.isRead",
          },

          lastChatMessageTime: {
            $first: "$chat.createdAt",
          },

          profileType: {
            $first: isHost ? "user" : "host",
          },
        },
      },
      {
        $lookup: {
          from: "chats",
          let: {
            topicId: "$chatTopic",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$chatTopicId",
                        "$$topicId",
                      ],
                    },
                    {
                      $eq: [
                        "$isRead",
                        false,
                      ],
                    },
                    {
                      $ne: [
                        "$senderId",
                        targetObjectId,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "unreadCount",
            },
          ],
          as: "unreads",
        },
      },
      {
        $addFields: {
          unreadCount: {
            $cond: [
              {
                $gt: [
                  {
                    $size: "$unreads",
                  },
                  0,
                ],
              },
              {
                $arrayElemAt: [
                  "$unreads.unreadCount",
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          senderId: 1,
          receiverId: 1,
          otherUserId: 1,

          chatTopic: 1,

          profileType: 1,

          name: 1,
          image: 1,

          gender: 1,
          country: 1,
          countryFlagImage: 1,

          isOnline: 1,
          isFake: 1,

          message: 1,
          messageType: 1,
          unreadCount: 1,
          lastChatMessageTime: 1,
        },
      },
      {
        $sort: {
          lastChatMessageTime: -1,
        },
      },
      {
        $skip: (start - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const finalChatList = chatList.map((item) => ({
      ...item,

      name: getDisplayName(
        item.name,
        item.otherUserId
      ),

      image:
        typeof item.image === "object"
          ? item.image
          : {
              url: getMediaUrl(item.image),
              key: item.image,
            },
    }));

    return res.status(200).json({
      status: true,
      message: "Success",
      chatList: finalChatList,
    });
  } catch (error) {
    console.error(
      "Error in fetchChatList:",
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
//get chat thumb list ( host )
exports.retrieveChatList = async (req, res) => {
  try {
    if (
      !req.query.hostId ||
      !mongoose.Types.ObjectId.isValid(req.query.hostId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid or missing hostId.",
      });
    }

    const hostObjectId = new mongoose.Types.ObjectId(
      req.query.hostId
    );

    const start = req.query.start
      ? parseInt(req.query.start)
      : 1;

    const limit = req.query.limit
      ? parseInt(req.query.limit)
      : 20;

    const chatList = await ChatTopic.aggregate([
      {
        $match: {
          chatId: { $ne: null },
          $or: [
            { senderId: hostObjectId },
            { receiverId: hostObjectId },
          ],
        },
      },
      {
        $addFields: {
          userId: {
            $cond: {
              if: {
                $eq: ["$senderId", hostObjectId],
              },
              then: "$receiverId",
              else: "$senderId",
            },
          },
        },
      },
      {
        $lookup: {
          from: "blocks",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        {
                          $eq: [
                            "$hostId",
                            hostObjectId,
                          ],
                        },
                        {
                          $eq: [
                            "$userId",
                            "$$userId",
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                        {
                          $eq: [
                            "$userId",
                            hostObjectId,
                          ],
                        },
                        {
                          $eq: [
                            "$hostId",
                            "$$userId",
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "blockInfo",
        },
      },
      {
        $match: {
          blockInfo: { $eq: [] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chatId",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$userId",

          hostId: {
            $first: hostObjectId,
          },

          userId: {
            $first: "$userId",
          },

          senderId: {
            $first: "$chat.senderId",
          },

          receiverId: {
            $first: "$receiverId",
          },

          chatId: {
            $first: "$chat._id",
          },

          chatTopic: {
            $first: "$chat.chatTopicId",
          },

          name: {
            $first: "$user.name",
          },

          image: {
            $first: "$user.image",
          },

          gender: {
            $first: "$user.gender",
          },

          country: {
            $first: "$user.country",
          },

          countryFlagImage: {
            $first: "$user.countryFlagImage",
          },

          isOnline: {
            $first: "$user.isOnline",
          },

          isFake: {
            $first: "$user.isFake",
          },

          isRead: {
            $first: "$chat.isRead",
          },

          message: {
            $first: "$chat.message",
          },

          messageType: {
            $first: "$chat.messageType",
          },

          lastChatMessageTime: {
            $first: "$chat.createdAt",
          },
        },
      },
      {
        $lookup: {
          from: "chats",
          let: {
            topicId: "$chatTopic",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$chatTopicId",
                        "$$topicId",
                      ],
                    },
                    {
                      $eq: [
                        "$isRead",
                        false,
                      ],
                    },
                    {
                      $ne: [
                        "$senderId",
                        hostObjectId,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "unreadCount",
            },
          ],
          as: "unreads",
        },
      },
      {
        $addFields: {
          unreadCount: {
            $cond: [
              {
                $gt: [
                  {
                    $size: "$unreads",
                  },
                  0,
                ],
              },
              {
                $arrayElemAt: [
                  "$unreads.unreadCount",
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          userId: 1,
          senderId: 1,
          receiverId: 1,
          chatTopic: 1,
          chatId: 1,

          name: 1,
          image: 1,
          gender: 1,
          country: 1,
          countryFlagImage: 1,

          isOnline: 1,
          isFake: 1,

          message: 1,
          messageType: 1,
          isRead: 1,
          unreadCount: 1,
          lastChatMessageTime: 1,

          time: {
            $let: {
              vars: {
                messageDay: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$lastChatMessageTime",
                  },
                },

                today: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: new Date(),
                  },
                },

                yesterday: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: new Date(
                      Date.now() -
                        24 *
                          60 *
                          60 *
                          1000
                    ),
                  },
                },

                dayOfWeek: {
                  $dayOfWeek:
                    "$lastChatMessageTime",
                },
              },

              in: {
                $cond: [
                  {
                    $eq: [
                      "$$messageDay",
                      "$$today",
                    ],
                  },
                  "Today",
                  {
                    $cond: [
                      {
                        $eq: [
                          "$$messageDay",
                          "$$yesterday",
                        ],
                      },
                      "Yesterday",
                      {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  1,
                                ],
                              },
                              then: "Sunday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  2,
                                ],
                              },
                              then: "Monday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  3,
                                ],
                              },
                              then: "Tuesday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  4,
                                ],
                              },
                              then: "Wednesday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  5,
                                ],
                              },
                              then: "Thursday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  6,
                                ],
                              },
                              then: "Friday",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$dayOfWeek",
                                  7,
                                ],
                              },
                              then: "Saturday",
                            },
                          ],
                          default: "Unknown day",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $sort: {
          lastChatMessageTime: -1,
        },
      },
      {
        $skip: (start - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const updatedChatList = chatList.map((item) => ({
      ...item,
      name: getDisplayName(
        item.name,
        item.userId
      ),
    }));

    return res.status(200).json({
      status: true,
      message: "Success",
      chatList: updatedChatList,
    });
  } catch (error) {
    console.error(
      "Chat list retrieval error:",
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
