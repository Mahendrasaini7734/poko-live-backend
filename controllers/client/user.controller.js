const User = require("../../models/user.model");
const { getMediaUrl } = require("../../util/media");
//fs
const fs = require("fs");
const path = require("path");

//mongoose
const mongoose = require("mongoose");

//import model
const History = require("../../models/history.model");
const Host = require("../../models/host.model");
const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");
const Message = require("../../models/message.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const Block = require("../../models/block.model");
const CheckIn = require("../../models/checkIn.model");
const HostMatchHistory = require("../../models/hostMatchHistory.model");
const LiveBroadcastView = require("../../models/liveBroadcastView.model");
const LiveBroadcaster = require("../../models/liveBroadcaster.model");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//userFunction
const userFunction = require("../../util/userFunction");
const { deleteFromS3 } = require("../../util/s3Service");

const deleteFileIfExists = (fileUrl) => {
  try {
    if (!fileUrl) return;

    if (!fileUrl.includes("storage")) return;

    const relativePath = fileUrl.substring(fileUrl.indexOf("storage"));
    const filePath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑 Deleted File =>", filePath);
    } else {
      console.log("⚠ File Not Found =>", filePath);
    }
  } catch (err) {
    console.log("Delete File Error =>", err.message);
  }
};

//generateHistoryUniqueId
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

//validatePlanExpiration
const validatePlanExpiration = require("../../util/validatePlanExpiration");

//private key
const admin = require("../../util/privateKey");

//check the user is exists or not with loginType 3 quick (identity)
exports.quickUserVerification = async (req, res) => {
  try {
    const { identity } = req.query;

    if (!identity) {
      return res.status(200).json({ status: false, message: "identity is required." });
    }

    const user = await User.findOne({ identity, loginType: 3 }).select("_id").lean();

    return res.status(200).json({
      status: true,
      message: user ? "User login successfully." : "User must sign up.",
      isLogin: !!user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//user login and sign up
exports.signInOrSignUpUser = async (req, res) => {
  try {
    const { identity, loginType, fcmToken, email, name, image, dob } = req.body;

    if (!loginType || loginType === undefined || !fcmToken) {
      if (req.file) deleteFile(req.file);

      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details!!",
      });
    }

    const { uid, provider } = req.user;

    let userQuery = {};

    // ----------------------------------------------------------------
    // LOGIN TYPE WISE USER QUERY
    // ----------------------------------------------------------------

    switch (loginType) {
      // EMAIL LOGIN
      case 1:
        if (!email) {
          return res.status(200).json({
            status: false,
            message: "Email is required.",
          });
        }

        userQuery = {
          email,
          loginType: 1,
        };

        break;

      // GOOGLE LOGIN
      case 2:
        if (!email) {
          return res.status(200).json({
            status: false,
            message: "Email is required.",
          });
        }

        userQuery = {
          email,
          loginType: 2,
        };

        break;

      // FIREBASE / ANONYMOUS LOGIN
      case 3:
        userQuery = {
          firebaseUid: uid,
        };

        break;

      default:
        if (req.file) deleteFile(req.file);

        return res.status(200).json({
          status: false,
          message: "Invalid loginType.",
        });
    }

    // ----------------------------------------------------------------
    // CHECK EXISTING USER
    // ----------------------------------------------------------------

    let user = await User.findOne(userQuery).select(
      "_id loginType name image fcmToken lastlogin isBlock isHost hostId firebaseUid dob"
    );

    // ----------------------------------------------------------------
    // LOGIN EXISTING USER
    // ----------------------------------------------------------------

    if (user) {
      console.log("✅ User already exists, logging in...");

      // BLOCK CHECK
      if (user.isBlock) {
        return res.status(403).json({
          status: false,
          message: "🚷 User is blocked by admin.",
        });
      }

      // HOST CHECK
      if (user.isHost && user.hostId) {
        const host = await Host.findById(user.hostId).select(
          "isBlock fcmToken"
        );

        if (host) {
          if (host.isBlock) {
            return res.status(403).json({
              status: false,
              message: "🚷 Host account is blocked by admin.",
            });
          }

          host.fcmToken = fcmToken || host.fcmToken;

          await host.save();
        }
      }

      // UPDATE USER DETAILS
      // user.name = name?.trim() || user.name;
      // user.dob = dob?.trim() || user.dob;

      // user.image = req.file
      //   ? req.file.path
      //   : image
      //     ? image
      //     : user.image;

      user.fcmToken = fcmToken || user.fcmToken;

      user.lastlogin = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      await user.save();

      return res.status(200).json({
        status: true,
        message: "User logged in successfully.",
        signUp: false,
        user,
      });
    }

    // ----------------------------------------------------------------
    // CREATE NEW USER
    // ----------------------------------------------------------------

    console.log("🆕 Registering new user...");

    const bonusCoins = settingJSON.loginBonus || 5000;

    const newUser = new User();

    newUser.firebaseUid = uid;
    newUser.provider = provider;
    newUser.coin = bonusCoins;

    newUser.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    // SAVE USER USING FUNCTION
    const createdUser = await userFunction(newUser, req);

    // ----------------------------------------------------------------
    // LOGIN BONUS HISTORY
    // ----------------------------------------------------------------

    const uniqueId = await generateHistoryUniqueId();

    await History.create({
      uniqueId,
      userId: createdUser._id,
      userCoin: bonusCoins,
      type: 1,
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });

    // ----------------------------------------------------------------
    // SEND LOGIN BONUS NOTIFICATION
    // ----------------------------------------------------------------

    if (createdUser?.fcmToken) {
      try {
        const payload = {
          token: createdUser.fcmToken,
          data: {
            title: "🚀 Instant Bonus Activated! 🎁",
            body:
              "🎊 Hooray! You've unlocked a special welcome reward just for joining us. Enjoy your bonus! 💰",
            type: "LOGINBONUS",
          },
        };

    

        await admin.messaging.send(payload);

        console.log("✅ Login bonus notification sent");
      } catch (error) {
        console.log("❌ Login bonus notification error:", error);
      }
    }

    // ----------------------------------------------------------------
    // SEND RANDOM HOST MESSAGES
    // ----------------------------------------------------------------
    const [hosts, latestMessageDoc] = await Promise.all([
      Host.find({
        video: { $ne: [] },
      })
        .sort({ createdAt: -1 })
        .limit(5),

      Message.findOne().sort({ createdAt: -1 }).lean(),
    ]);

    const fallbackMessages = [
      "Hey there! 👋",
      "How's your day going? 😊",
      "Wanna chat? 💬",
      "You look amazing today! ✨",
      "Let's talk! 💖",
      "Hope you're having a great time! 🌟",
      "What's your favorite movie? 🎬",
      "I’d love to get to know you better! 😄",
    ];

    for (const host of hosts) {
      const existingTopic = await ChatTopic.findOne({
        $or: [
          {
            senderId: host._id,
            receiverId: createdUser._id,
          },
          {
            senderId: createdUser._id,
            receiverId: host._id,
          },
        ],
      });

      const messages =
        latestMessageDoc?.message?.length > 0
          ? latestMessageDoc.message
          : fallbackMessages;

      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];

      const messageType = Math.random() < 0.5 ? 1 : 2;

      let imageUrl = "";

      if (messageType === 2) {
        const images = Array.isArray(host.image)
          ? host.image
          : [host.image];

        if (images.length > 0) {
          imageUrl = images[Math.floor(Math.random() * images.length)];
        }
      }

      let chatTopic = existingTopic;

      // CREATE TOPIC
      if (!chatTopic) {
        chatTopic = new ChatTopic({
          senderId: host._id,
          receiverId: createdUser._id,
        });

        await chatTopic.save();
      }

      // CREATE CHAT
      const chat = new Chat({
        chatTopicId: chatTopic._id,
        senderId: host._id,
        messageType,
        message: messageType === 2 ? "📸 Image" : randomMessage,
        image: messageType === 2 ? imageUrl : "",
        date: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      });

      await chat.save();

      chatTopic.chatId = chat._id;

      await chatTopic.save();

      // SEND PUSH
      if (createdUser?.fcmToken) {
        try {
          const payload = {
            token: createdUser.fcmToken,
            data: {
              title: `${host.name} sent you a message 📩`,
              body: `🗨️ ${chat.message}`,
              type: "CHAT",
              senderId: String(host._id),
              isFake: String(host.isFake),
              receiverId: String(createdUser._id),
              userName: String(host.name),
              hostName: String(createdUser.name),
              userImage: String(host.image || ""),
              hostImage: String(createdUser.image || ""),
              senderRole: "host",
              isFakeSender: String(host.isFake || "false"),
            },
          };

          const adminInstance = await admin;

          await adminInstance.messaging().send(payload);
        } catch (error) {
          console.log("❌ Chat push error:", error);
        }
      }
    }

    // ----------------------------------------------------------------
    // FINAL RESPONSE
    // ----------------------------------------------------------------

    return res.status(200).json({
      status: true,
      message: "A new user has registered successfully.",
      signUp: true,
      user: {
        _id: createdUser._id,
        loginType: createdUser.loginType,
        name: createdUser.name,
        image: createdUser.image,
        fcmToken: createdUser.fcmToken,
        lastlogin: createdUser.lastlogin,
      },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);

    console.error("❌ Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

//update profile of the user
exports.modifyUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const user = await User.findById(userId);

    if (!user) {
      if (req.file?.key) {
        await deleteFromS3(req.file.key);
      }

      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (req.file) {
      if (user.image) {
        try {
          await deleteFromS3(user.image);
        } catch (err) {
          console.error("Old image delete failed:", err.message);
        }
      }

      user.image = req.file.key;
    }

    if (req.body.name !== undefined) {
      user.name = req.body.name.trim();
    }

    if (req.body.selfIntro !== undefined) {
      user.selfIntro = req.body.selfIntro.trim();
    }

    if (req.body.gender !== undefined) {
      user.gender = req.body.gender.toLowerCase().trim();
    }

    if (req.body.bio !== undefined) {
      user.bio = req.body.bio.trim();
    }

    if (req.body.dob !== undefined) {
      user.dob = req.body.dob.trim();
    }

    if (req.body.age !== undefined) {
      user.age = Number(req.body.age);
    }

    if (req.body.countryFlagImage !== undefined) {
      user.countryFlagImage = req.body.countryFlagImage;
    }

    if (req.body.country !== undefined) {
      user.country = req.body.country.toLowerCase().trim();
    }

    if (req.body.countryCode !== undefined) {
      user.countryCode = req.body.countryCode
        .toString()
        .trim()
        .replace(/\s+/g, "");
    }

    if (req.body.phoneNumber !== undefined) {
      user.phoneNumber = req.body.phoneNumber
        .toString()
        .trim()
        .replace(/\s+/g, "");
    }

    if (
      req.body.countryCode !== undefined ||
      req.body.phoneNumber !== undefined
    ) {
      const countryCode = user.countryCode
        ? user.countryCode.toString().trim().replace(/\s+/g, "")
        : "";

      const phoneNumber = user.phoneNumber
        ? user.phoneNumber.toString().trim().replace(/\s+/g, "")
        : "";

      if (countryCode && phoneNumber) {
        user.fullPhoneNumber = `${countryCode}${phoneNumber}`;
      }
    }

    await user.save();

    const userData = user.toObject();

    userData.image = user.image
      ? `${process.env.MEDIA_BASE_URL}/${user.image}`
      : "";

    return res.status(200).json({
      status: true,
      message: "User profile updated successfully.",
      user: userData,
    });
  } catch (error) {
    console.error("modifyUserProfile error:", error);

    if (req.file?.key) {
      await deleteFromS3(req.file.key);
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};



//get user profile
exports.retrieveUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [user, hostRequest] = await Promise.all([
      User.findById(userId).lean(),
      Host.findOne({ userId }).select("status").lean(),
    ]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    const hasHostRequest = Boolean(hostRequest);

    if (
      user.isVip &&
      user.vipPlanId &&
      user.vipPlanStartDate &&
      user.vipPlanEndDate
    ) {
      try {
        validatePlanExpiration(
          user,
          user.vipPlan.validity,
          user.vipPlan.validityType
        );
      } catch (e) {
        console.log(
          "VIP validation skipped:",
          e.message
        );
      }
    }

    const userData = {
      ...user,
      image: getMediaUrl(user.image),
      countryCode: user.countryCode || "",
      phoneNumber: user.phoneNumber || "",
      fullPhoneNumber: user.fullPhoneNumber || "",
    };

    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully.",
      user: userData,
      hasHostRequest,
      hostRequestStatus: hostRequest?.status ?? null,
    });
  } catch (error) {
    console.error(
      "retrieveUserProfile error:",
      error
    );

    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//delete user
exports.deactivateMyAccount = async (req, res) => {
  try {
    const userUid = req.headers["x-user-uid"];

    if (!userUid) {
      return res.status(401).json({
        status: false,
        message: "User UID required.",
      });
    }

    const user = await User.findOne({
      firebaseUid: userUid,
    }).lean();

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // ===========================
    // HOST DATA DELETE
    // ===========================

    if (user.isHost && user.hostId) {
      const host = await Host.findById(user.hostId)
        .select("_id image photoGallery video liveVideo")
        .lean();

      if (host) {
        deleteFileIfExists(host.image);

        host.photoGallery?.forEach(deleteFileIfExists);
        host.video?.forEach(deleteFileIfExists);
        host.liveVideo?.forEach(deleteFileIfExists);

        await LiveBroadcastHistory.deleteMany({
          hostId: host._id,
        });

        await Host.deleteOne({
          _id: host._id,
        });
      }
    }

    // ===========================
    // USER IMAGE DELETE
    // ===========================

    deleteFileIfExists(user.image);

    // ===========================
    // CHAT MEDIA DELETE
    // ===========================

    const chats = await Chat.find({
      senderId: user._id,
    });

    chats.forEach((chat) => {
      deleteFileIfExists(chat.image);
      deleteFileIfExists(chat.audio);
    });

    // ===========================
    // DATABASE DELETE
    // ===========================

    await Promise.all([
      ChatTopic.deleteMany({
        $or: [
          { senderId: user._id },
          { receiverId: user._id },
        ],
      }),

      Chat.deleteMany({
        senderId: user._id,
      }),

      Block.deleteMany({
        userId: user._id,
      }),

      CheckIn.deleteMany({
        userId: user._id,
      }),

      History.deleteMany({
        userId: user._id,
      }),

      HostMatchHistory.deleteMany({
        userId: user._id,
      }),

      LiveBroadcaster.deleteMany({
        userId: user._id,
      }),

      LiveBroadcastView.deleteMany({
        userId: user._id,
      }),

      User.deleteOne({
        _id: user._id,
      }),
    ]);

    // ===========================
    // FIREBASE DELETE
    // ===========================

    if (user.firebaseUid) {
      try {
        const firebaseAdmin = await admin;

        await firebaseAdmin
          .auth()
          .deleteUser(user.firebaseUid);

        console.log(
          "✅ Firebase User Deleted =>",
          user.firebaseUid
        );
      } catch (err) {
        console.log(
          "❌ Firebase Delete Error =>",
          err.message
        );
      }
    }

    console.log("==================================");
    console.log("ACCOUNT DELETE SUCCESS");
    console.log("User :", user._id);
    console.log("Firebase :", user.firebaseUid);
    console.log("==================================");

    return res.status(200).json({
      status: true,
      message: "User account deleted successfully.",
    });
  } catch (error) {
    console.log("ACCOUNT DELETE ERROR =>", error);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
