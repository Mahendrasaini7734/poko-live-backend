const Block = require("../../models/block.model");

//import model
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const { getMediaUrl, getMediaUrls } = require("../../util/media");
const firebase = require("../../util/privateKey");
//mongoose
const mongoose = require("mongoose");

//handle user blocking a host
exports.blockHost = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }


    if (!req.query.hostId) {
      return res.status(200).json({
        status: false,
        message: "hostId is required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.query.hostId
      )
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid hostId.",
      });
    }

    const userId =
      new mongoose.Types.ObjectId(
        req.user.userId
      );

    const hostId =
      new mongoose.Types.ObjectId(
        req.query.hostId
      );

    const [
      user,
      host,
      existingBlock,
    ] = await Promise.all([
      User.findOne({
        _id: userId,
        isBlock: false,
      })
        .select(
          "_id name image"
        )
        .lean(),

      Host.findOne({
        _id: hostId,
        isBlock: false,
      })
        .select(
          "_id userId name image fcmToken"
        )
        .lean(),

      Block.findOne({
        userId: userId,
        hostId: hostId,
        blockedBy: "user",
        blockedType: "host",
      })
        .select("_id")
        .lean(),
    ]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }

    if (
      user._id.toString() ===
      host.userId?.toString()
    ) {
      return res.status(200).json({
        status: false,
        message:
          "You can't block your own account.",
      });
    }


    if (existingBlock) {
      const deleteResult =
        await Block.deleteOne({
          _id: existingBlock._id,
        });




      return res.status(200).json({
        status: true,
        message:
          "Host unblocked successfully.",
        isBlocked: false,
        blockedType: "host",
        blockId:
          existingBlock._id,
      });
    }

    const newBlock =
      await Block.create({
        userId: user._id,
        hostId: host._id,
        targetHostId: null,
        blockedBy: "user",
        blockedType: "host",
      });


    res.status(200).json({
      status: true,
      message:
        "Host blocked successfully.",
      isBlocked: true,
      blockedType: "host",
      blockId:
        newBlock._id,
    });

    if (host.fcmToken) {
      const blockerName =
        user.name || "User";

      const notificationTitle =
        "🚫 Account Blocked";

      const notificationBody =
        `${blockerName} has blocked you.`;

      const payload = {
        token:
          host.fcmToken,

        data: {
          title:
            notificationTitle,

          body:
            notificationBody,

          type:
            "BLOCK",

          blockerId:
            String(user._id),

          blockerName:
            String(blockerName),

          targetId:
            String(host._id),

          blockedBy:
            "user",

          blockedType:
            "host",

          blockId:
            String(newBlock._id),

          isBlocked:
            "true",

          isFakeSender:
            "false",
        },
      };

      try {
        const response =
          await firebase.messaging.send(
            payload
          );



      } catch (error) {
        console.log(
          "❌ BLOCK NOTIFICATION ERROR =>",
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ blockHost Error:",
      error
    );

    if (res.headersSent) {
      return;
    }

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// handle host blocking a user OR another host
exports.blockUser = async (req, res) => {
  try {
    const { hostId, userId } = req.query;

    if (!hostId || !userId) {
      return res.status(200).json({
        status: false,
        message: "hostId and userId are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(hostId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid hostId or userId.",
      });
    }

    const firstId =
      new mongoose.Types.ObjectId(hostId);

    const secondId =
      new mongoose.Types.ObjectId(userId);

    const [
      hostByFirstId,
      userByFirstId,
      hostBySecondId,
      hostBySecondUserId,
      targetUserBySecondId,
    ] = await Promise.all([
      Host.findOne({
        _id: firstId,
        isBlock: false,
      })
        .select("_id userId name")
        .lean(),

      User.findOne({
        _id: firstId,
        isBlock: false,
      })
        .select("_id name fcmToken")
        .lean(),

      Host.findOne({
        _id: secondId,
        isBlock: false,
      })
        .select("_id userId name fcmToken")
        .lean(),

      Host.findOne({
        userId: secondId,
        isBlock: false,
      })
        .select("_id userId name fcmToken")
        .lean(),

      User.findOne({
        _id: secondId,
        isBlock: false,
      })
        .select("_id name fcmToken")
        .lean(),
    ]);

   

    let currentHost = null;
    let targetHost = null;
    let targetUser = null;

    if (
      hostBySecondUserId &&
      hostByFirstId
    ) {
      currentHost =
        hostBySecondUserId;

      targetHost =
        hostByFirstId;
    } else if (
      hostBySecondId &&
      hostByFirstId
    ) {
      currentHost =
        hostBySecondId;

      targetHost =
        hostByFirstId;
    } else if (
      hostBySecondUserId &&
      userByFirstId
    ) {
      currentHost =
        hostBySecondUserId;

      targetUser =
        userByFirstId;
    }

    if (!currentHost) {
      return res.status(200).json({
        status: false,
        message:
          "Current host not found.",
      });
    }

    console.log(
      "========== RESOLVED =========="
    );

    console.log(
      "Current Host:",
      currentHost._id.toString()
    );

    console.log(
      "Current Host User:",
      currentHost.userId?.toString()
    );

    console.log(
      "Target Host:",
      targetHost?._id?.toString() ||
      null
    );

    console.log(
      "Target User:",
      targetUser?._id?.toString() ||
      null
    );

    console.log(
      "=============================="
    );

    if (targetHost) {
      if (
        currentHost._id.toString() ===
        targetHost._id.toString()
      ) {
        return res.status(200).json({
          status: false,
          message:
            "You can't block your own account.",
        });
      }

      const existingBlock =
        await Block.findOne({
          hostId:
            currentHost._id,

          targetHostId:
            targetHost._id,

          blockedBy:
            "host",

          blockedType:
            "host",
        })
          .select("_id")
          .lean();

      console.log(
        "========== HOST BLOCK =========="
      );

      console.log(
        "Current Host:",
        currentHost._id
      );

      console.log(
        "Target Host:",
        targetHost._id
      );

      console.log(
        "Existing Block:",
        existingBlock
      );

      console.log(
        "================================"
      );

      if (existingBlock) {
        const result =
          await Block.deleteOne({
            _id:
              existingBlock._id,
          });

        console.log(
          "HOST UNBLOCK RESULT:",
          result
        );

        return res.status(200).json({
          status: true,
          message:
            "Host unblocked successfully.",
          isBlocked: false,
          blockedType: "host",
          blockId:
            existingBlock._id,
        });
      }

      const newBlock =
        await Block.create({
          userId:
            targetHost.userId ||
            null,

          hostId:
            currentHost._id,

          targetHostId:
            targetHost._id,

          blockedBy:
            "host",

          blockedType:
            "host",
        });

      console.log(
        "🚫 HOST -> HOST BLOCK CREATED:",
        newBlock._id.toString()
      );

      if (targetHost.fcmToken) {
        const blockerName =
          currentHost.name ||
          "Host";

        const payload = {
          token:
            targetHost.fcmToken,

          data: {
            title:
              "🚫 Account Blocked",

            body:
              `${blockerName} has blocked you.`,

            type:
              "BLOCK",

            blockerId:
              String(
                currentHost._id
              ),

            blockerName:
              String(
                blockerName
              ),

            targetId:
              String(
                targetHost._id
              ),

            blockedBy:
              "host",

            blockedType:
              "host",

            blockId:
              String(
                newBlock._id
              ),

            isBlocked:
              "true",

            isFakeSender:
              "false",
          },
        };

        try {
          const response =
            await firebase.messaging.send(
              payload
            );

          console.log(
            "🚫 HOST -> HOST BLOCK NOTIFICATION SENT =>",
            {
              blockerId:
                String(
                  currentHost._id
                ),

              blockerName,

              targetHostId:
                String(
                  targetHost._id
                ),

              blockId:
                String(
                  newBlock._id
                ),

              response,
            }
          );
        } catch (error) {
          console.log(
            "❌ HOST -> HOST BLOCK NOTIFICATION ERROR =>",
            error.message
          );
        }
      } else {
        console.log(
          "⚠️ HOST -> HOST BLOCK => FCM TOKEN NOT FOUND"
        );
      }

      return res.status(200).json({
        status: true,
        message:
          "Host blocked successfully.",
        isBlocked: true,
        blockedType: "host",
        blockId:
          newBlock._id,
      });
    }

    if (targetUser) {
      if (
        currentHost.userId &&
        currentHost.userId.toString() ===
        targetUser._id.toString()
      ) {
        return res.status(200).json({
          status: false,
          message:
            "You can't block your own account.",
        });
      }

      const existingBlock =
        await Block.findOne({
          hostId:
            currentHost._id,

          userId:
            targetUser._id,

          blockedBy:
            "host",

          blockedType:
            "user",
        })
          .select("_id")
          .lean();

      console.log(
        "========== USER BLOCK =========="
      );

      console.log(
        "Current Host:",
        currentHost._id
      );

      console.log(
        "Target User:",
        targetUser._id
      );

      console.log(
        "Existing Block:",
        existingBlock
      );

      console.log(
        "================================"
      );

      if (existingBlock) {
        const result =
          await Block.deleteOne({
            _id:
              existingBlock._id,
          });

        console.log(
          "USER UNBLOCK RESULT:",
          result
        );

        return res.status(200).json({
          status: true,
          message:
            "User unblocked successfully.",
          isBlocked: false,
          blockedType: "user",
          blockId:
            existingBlock._id,
        });
      }

      const newBlock =
        await Block.create({
          userId:
            targetUser._id,

          hostId:
            currentHost._id,

          targetHostId:
            null,

          blockedBy:
            "host",

          blockedType:
            "user",
        });

      console.log(
        "🚫 HOST -> USER BLOCK CREATED:",
        newBlock._id.toString()
      );

      if (targetUser.fcmToken) {
        const blockerName =
          currentHost.name ||
          "Host";

        const payload = {
          token:
            targetUser.fcmToken,

          data: {
            title:
              "🚫 Account Blocked",

            body:
              `${blockerName} has blocked you.`,

            type:
              "BLOCK",

            blockerId:
              String(
                currentHost._id
              ),

            blockerName:
              String(
                blockerName
              ),

            targetId:
              String(
                targetUser._id
              ),

            blockedBy:
              "host",

            blockedType:
              "user",

            blockId:
              String(
                newBlock._id
              ),

            isBlocked:
              "true",

            isFakeSender:
              "false",
          },
        };

        try {
          const response =
            await firebase.messaging.send(
              payload
            );

          console.log(
            "🚫 HOST -> USER BLOCK NOTIFICATION SENT =>",
            {
              blockerId:
                String(
                  currentHost._id
                ),

              blockerName,

              targetUserId:
                String(
                  targetUser._id
                ),

              blockId:
                String(
                  newBlock._id
                ),

              response,
            }
          );
        } catch (error) {
          console.log(
            "❌ HOST -> USER BLOCK NOTIFICATION ERROR =>",
            error.message
          );
        }
      } else {
        console.log(
          "⚠️ HOST -> USER BLOCK => FCM TOKEN NOT FOUND"
        );
      }

      return res.status(200).json({
        status: true,
        message:
          "User blocked successfully.",
        isBlocked: true,
        blockedType: "user",
        blockId:
          newBlock._id,
      });
    }

    return res.status(200).json({
      status: false,
      message:
        "Target user or host not found.",
    });
  } catch (error) {
    console.error(
      "❌ blockUser Error:",
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
//get blocked hosts for a user
exports.getBlockedHostsForUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const blockedHosts = await Block.find({ blockedBy: "user", userId })
      .select("hostId")
      .populate("hostId", "name image countryFlagImage country")
      .skip((start - 1) * limit)
      .limit(limit)
      .lean();

    console.log("HOST DATA", blockedHosts);

    return res.status(200).json({
      status: true,
      message: blockedHosts.length > 0 ? "Blocked hosts retrieved successfully." : "No blocked hosts found.",
      blockedHosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// get blocked users + hosts for a host
exports.getBlockedUsersForHost = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({
        status: false,
        message: "hostId is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid hostId.",
      });
    }

    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    const currentHostId = new mongoose.Types.ObjectId(hostId);

    const currentHost = await Host.findOne({
      _id: currentHostId,
      isBlock: false,
    })
      .select("_id userId")
      .lean();

    if (!currentHost) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }

    console.log("========== BLOCK FETCH ==========");
    console.log("Requested Host ID:", currentHostId);
    console.log("Current Host ID:", currentHost._id);
    console.log("Current Host User ID:", currentHost.userId);
    console.log("=================================");

    const [userBlockRecords, hostBlockRecords] =
      await Promise.all([
        Block.find({
          hostId: currentHost._id,
          blockedBy: "host",
          blockedType: "user",
          userId: { $ne: null },
        })
          .sort({ createdAt: -1 })
          .lean(),

        Block.find({
          hostId: currentHost._id,
          blockedBy: "host",
          blockedType: "host",
          targetHostId: { $ne: null },
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    console.log("========== USER BLOCK RECORDS ==========");
    console.log(userBlockRecords);
    console.log("========================================");

    console.log("========== HOST BLOCK RECORDS ==========");
    console.log(hostBlockRecords);
    console.log("=======================================");

    const userIds = userBlockRecords.map(
      (record) => record.userId
    );

    const targetHostIds = hostBlockRecords.map(
      (record) => record.targetHostId
    );

    const [users, blockedHosts] = await Promise.all([
      userIds.length
        ? User.find({
          _id: { $in: userIds },
        })
          .select(
            "_id name image uniqueId country countryFlagImage"
          )
          .lean()
        : [],

      targetHostIds.length
        ? Host.find({
          _id: { $in: targetHostIds },
          isBlock: false,
        })
          .select(
            "_id userId name image uniqueId country countryFlagImage isOnline isLive isBusy"
          )
          .lean()
        : [],
    ]);

    const formatImage = (image) => {
      if (!image) {
        return {
          url: "",
          key: "",
        };
      }

      if (typeof image === "object") {
        const key = image.key || "";

        return {
          url: key
            ? getMediaUrl(key)
            : image.url || "",
          key,
        };
      }

      if (
        typeof image === "string" &&
        (
          image.startsWith("http://") ||
          image.startsWith("https://")
        )
      ) {
        return {
          url: image,
          key: "",
        };
      }

      return {
        url: getMediaUrl(image),
        key: image,
      };
    };

    const userMap = new Map();

    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const hostMap = new Map();

    blockedHosts.forEach((host) => {
      hostMap.set(host._id.toString(), host);
    });

    const blockedUsers = [];

    for (const record of userBlockRecords) {
      const user = userMap.get(
        record.userId.toString()
      );

      if (!user) {
        continue;
      }

      blockedUsers.push({
        _id: user._id,
        userId: user._id,
        name: user.name || "",
        image: formatImage(user.image),
        uniqueId: user.uniqueId || "",
        country: user.country || "",
        countryFlagImage:
          user.countryFlagImage || "",
        type: "user",
        blockId: record._id,
        blockedAt: record.createdAt,
      });
    }

    const blockedHostList = [];

    for (const record of hostBlockRecords) {
      const host = hostMap.get(
        record.targetHostId.toString()
      );

      if (!host) {
        continue;
      }

      blockedHostList.push({
        _id: host._id,
        userId: host.userId || null,
        name: host.name || "",
        image: formatImage(host.image),
        uniqueId: host.uniqueId || "",
        country: host.country || "",
        countryFlagImage:
          host.countryFlagImage || "",
        isOnline: Boolean(host.isOnline),
        isLive: Boolean(host.isLive),
        isBusy: Boolean(host.isBusy),
        type: "host",
        blockId: record._id,
        blockedAt: record.createdAt,
      });
    }

    const blockedList = [
      ...blockedUsers,
      ...blockedHostList,
    ].sort((a, b) => {
      return (
        new Date(b.blockedAt || 0) -
        new Date(a.blockedAt || 0)
      );
    });

    const total = blockedList.length;

    const skip = (start - 1) * limit;

    const paginatedList = blockedList.slice(
      skip,
      skip + limit
    );

    console.log("========== FINAL BLOCK LIST ==========");
    console.log("Blocked Users:", blockedUsers);
    console.log("Blocked Hosts:", blockedHostList);
    console.log("Total:", total);
    console.log("Final List:", paginatedList);
    console.log("======================================");

    return res.status(200).json({
      status: true,
      message:
        paginatedList.length > 0
          ? "Blocked history retrieved successfully."
          : "No blocked history found.",
      total,
      totalPages: Math.ceil(total / limit),
      start,
      limit,
      blockedUsers: paginatedList,
    });
  } catch (error) {
    console.error(
      "❌ getBlockedUsersForHost Error:",
      error
    );


    return res.status(500).json({
      status: false,
      message:
        error.message || "Internal Server Error",
    });
  }
};
