///import model
const Agency = require("./models/agency.model");
const User = require("./models/user.model");
const Host = require("./models/host.model");
const ChatTopic = require("./models/chatTopic.model");
const Chat = require("./models/chat.model");
const History = require("./models/history.model");
const Gift = require("./models/gift.model");
const Privatecall = require("./models/privatecall.model");
const Randomcall = require("./models/randomcall.model");
const LiveBroadcaster = require("./models/liveBroadcaster.model");
const LiveBroadcastView = require("./models/liveBroadcastView.model");
const LiveBroadcastHistory = require("./models/liveBroadcastHistory.model");
const VipPlanPrivilege = require("./models/vipPlanPrivilege.model");
const Block = require("./models/block.model");
const Participant = require("./models/participant.model");
const Room = require("./models/room.model");
const { buildToken } = require("./util/agoraToken");
const generateHistoryUniqueId = require("./util/generateHistoryUniqueId");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const admin = require("./util/privateKey");

const { getMediaUrl,
  getMediaObject, } = require("./util/media");
const notificationService = require("./services/notification.service");
const liveAnalyticsService = require("./services/liveAnalytics.service");
const liveRoomService = require("./services/liveRoom.service");
const liveSocketHandlers = require("./services/liveSocketHandlers");

const { getDisplayName } = require("./util/hostDisplay");
const { registerFeedSocketHandlers } = require("./services/feedRealtime.service");

const {
  sendUserOnlineNotificationToHosts,
} = require("./services/userOnlineNotification.service");
const {
  sendHostOnlineNotificationToUsers,
} = require("./services/hostOnlineNotifictaions.service");
// =====================================================
// COMMON FUNCTION START
// =====================================================
const activeCallBilling = new Map();
async function createCallChat({
  callerId,
  receiverId,
  callId,
  callType,
  callStatus,
}) {
  const type = String(callType || "")
    .trim()
    .toLowerCase();

  let chatTopic = await ChatTopic.findOne({
    $or: [
      {
        senderId: callerId,
        receiverId: receiverId,
      },
      {
        senderId: receiverId,
        receiverId: callerId,
      },
    ],
  });

  const chat = new Chat();

  if (!chatTopic) {
    chatTopic = new ChatTopic({
      chatId: chat._id,
      senderId: callerId,
      receiverId: receiverId,
    });
  }

  chat.chatTopicId = chatTopic._id;
  chat.senderId = callerId;
  chat.messageType =
    type === "audio" ? 5 : 6;

  chat.message =
    type === "audio"
      ? "📞 Audio Call"
      : "📹 Video Call";

  chat.callType = callStatus;
  chat.callId = callId;
  chat.isRead = true;

  chat.date = new Date().toISOString();

  chatTopic.chatId = chat._id;

  await Promise.all([
    chat.save(),
    chatTopic.save(),
  ]);

  return chat;
}

const clearCallBilling = (callId) => {
  const key = String(callId);
  const timer = activeCallBilling.get(key);

  if (timer) {
    clearInterval(timer);
    activeCallBilling.delete(key);
  }
};
/// UPDATE HOST LIVE OR ONLINE STATUS
const emitHostStatusUpdate = async (io, hostId) => {
  try {
    if (!hostId) {
      console.log(
        "❌ HOST STATUS UPDATE => HOST ID MISSING"
      );
      return;
    }

    const host = await Host.findOne({
      _id: hostId,
      isBlock: false,
    })
      .select(
        "_id userId name age uniqueId image video country countryFlagImage language isLive isOnline isBusy isFake view coin totalGifts audioCallRate privateCallRate randomCallRate randomCallFemaleRate randomCallMaleRate chatRate channel token agoraUid liveUid liveHistoryId createdAt"
      )
      .lean();

    if (!host) {
      console.log(
        "❌ HOST STATUS UPDATE => HOST NOT FOUND:",
        String(hostId)
      );
      return;
    }

    const displayName = getDisplayName(
      host.name,
      host._id
    );

    let country = String(
      host.country || "global"
    )
      .trim()
      .toLowerCase();

    if (
      !country ||
      country === "world wide" ||
      country === "worldwide"
    ) {
      country = "global";
    }

    const roomName =
      `hostList:${country}`;

    const hostData = {
      ...host,
      _id: host._id.toString(),
      userId: host.userId
        ? host.userId.toString()
        : null,
      name: host.name || "",
      displayName,
      hostType: host.isLive
        ? "live"
        : host.isOnline
          ? "online"
          : "offline",
      status: host.isLive
        ? "Live"
        : host.isOnline
          ? "Online"
          : "Offline",
    };

    const countrySockets =
      await io
        .in(roomName)
        .fetchSockets();

    console.log(
      "🔥 HOST STATUS UPDATE =>",
      {
        hostId: host._id.toString(),
        country,
        name: host.name || "",
        socketCount:
          countrySockets.length,
        isOnline: host.isOnline,
        isLive: host.isLive,
        isBusy: host.isBusy,
      }
    );

    io.to(roomName).emit(
      "hostStatusUpdate",
      hostData
    );

    if (country !== "global") {
      const globalSockets =
        await io
          .in("hostList:global")
          .fetchSockets();

      io.to("hostList:global").emit(
        "hostStatusUpdate",
        hostData
      );
    }
  } catch (error) {
    console.error(
      "emitHostStatusUpdate ERROR =>",
      error
    );
  }
};

/// UPDATE CHAT MESASESS
const emitChatListUpdate = async ({
  io,
  userId,
  otherUserId,
  otherUserRole,
  chatTopic,
  chat,
}) => {
  try {
    console.log("CHAT LIST | START", {
      userId: userId ? String(userId) : null,
      otherUserId: otherUserId ? String(otherUserId) : null,
      otherUserRole: otherUserRole || null,
      chatTopicId: chatTopic?._id ? String(chatTopic._id) : null,
      chatId: chat?._id ? String(chat._id) : null,
    });

    if (!io) {
      console.log("CHAT LIST | IO NOT FOUND");
      return;
    }

    if (!userId) {
      console.log("CHAT LIST | USER ID MISSING");
      return;
    }

    if (!otherUserId) {
      console.log("CHAT LIST | OTHER USER ID MISSING");
      return;
    }

    if (!otherUserRole) {
      console.log("CHAT LIST | OTHER USER ROLE MISSING");
      return;
    }

    if (!chatTopic?._id) {
      console.log("CHAT LIST | TOPIC ID MISSING");
      return;
    }

    if (!chat?._id) {
      console.log("CHAT LIST | CHAT ID MISSING");
      return;
    }

    const userIdString = String(userId);
    const otherUserIdString = String(otherUserId);
    const chatTopicIdString = String(chatTopic._id);
    const chatIdString = String(chat._id);

    const unreadCount = await Chat.countDocuments({
      chatTopicId: chatTopic._id,
      isRead: false,
      senderId: { $ne: userId },
    });

    console.log("CHAT LIST | UNREAD COUNT", {
      userId: userIdString,
      unreadCount,
    });

    let profile = null;

    if (otherUserRole === "host") {
      profile = await Host.findById(otherUserId)
        .select(
          "_id name image gender country countryFlagImage isOnline isFake"
        )
        .lean();
    } else if (otherUserRole === "user") {
      profile = await User.findById(otherUserId)
        .select(
          "_id name image gender country countryFlagImage isOnline isFake"
        )
        .lean();
    }

    console.log("CHAT LIST | PROFILE SOURCE", {
      otherUserId: otherUserIdString,
      otherUserRole,
      profileId: profile?._id ? String(profile._id) : null,
      image: profile?.image || null,
    });

    if (!profile) {
      console.log("CHAT LIST | PROFILE NOT FOUND", {
        userId: userIdString,
        otherUserId: otherUserIdString,
        otherUserRole,
      });
      return;
    }

    const displayName = getDisplayName(
      profile.name || "",
      profile._id
    );

    let image = "";

    if (typeof profile.image === "string") {
      image = profile.image;
    } else if (profile.image && typeof profile.image === "object") {
      image =
        profile.image.url ||
        profile.image.image ||
        profile.image.path ||
        "";
    }

    if (image && !image.startsWith("http://") && !image.startsWith("https://")) {
      image = `https://zigo-live-media.stackearn.com/${image.replace(/^\/+/, "")}`;
    }

    console.log("CHAT LIST | FINAL PROFILE IMAGE", {
      otherUserId: otherUserIdString,
      otherUserRole,
      image,
    });

    const chatImage =
      chat.image && typeof chat.image === "object"
        ? chat.image.url || ""
        : typeof chat.image === "string"
          ? chat.image
          : "";

    const chatAudio =
      chat.audio && typeof chat.audio === "object"
        ? chat.audio.url || ""
        : typeof chat.audio === "string"
          ? chat.audio
          : "";

    const payload = {
      action: "update",
      chat: {
        _id: chat._id,
        receiverId: otherUserId,
        name: displayName || profile.name || "",
        image,
        gender: profile.gender || "",
        country: profile.country || "",
        countryFlagImage: profile.countryFlagImage || "",
        isFake: Boolean(profile.isFake),
        isOnline: Boolean(profile.isOnline),
        chatTopic: chatTopic._id,
        senderId: chat.senderId,
        messageType: Number(chat.messageType || 1),
        message: chat.message || "",
        imageData: chatImage || null,
        audioData: chatAudio || null,
        unreadCount,
        lastChatMessageTime: chat.createdAt || chat.date,
        time: chat.createdAt || chat.date,
      },
    };

    const room = `chatList:${userIdString}`;

    console.log("CHAT LIST | EMITTING", {
      room,
      event: "chatListUpdate",
      userId: userIdString,
      otherUserId: otherUserIdString,
      otherUserRole,
      chatId: chatIdString,
      chatTopicId: chatTopicIdString,
      image,
      unreadCount,
    });

    io.to(room).emit("chatListUpdate", payload);

    console.log(
      "CHAT LIST | EMITTED SUCCESSFULLY",
      room
    );
  } catch (error) {
    console.log(
      "CHAT LIST | UPDATE ERROR",
      error
    );
  }
};




// COMMON FUNCTION ENDED
// lets services (live-session reaper / HTTP end / admin end) refresh the host lists without importing socket.js
global.emitHostStatusUpdate = (hostId) => emitHostStatusUpdate(io, hostId);

// viewer count self-healing for every running live (also covers a server restart)
liveRoomService.startViewerSweep(io);

// Host connection dropped while LIVE -> grace period / room restore live in services/liveSocketHandlers.js

io.on("connection", async (socket) => {
  // ADMIN PANEL (Live Analytics): admins authenticate with a Firebase token, not loginUserId.
  // They only join the read-only admin room - none of the app handlers below are registered for them.
  if (liveAnalyticsService.isAdminHandshake(socket)) {
    liveAnalyticsService.registerAdminSocket(socket);
    return;
  }

  console.log("🔥🔥 NEW SOCKET CONNECTION 🔥🔥");
  console.log("SOCKET ID =>", socket.id);
  console.log("SOCKET HANDSHAKE URL =>", socket.handshake.url);
  console.log("SOCKET QUERY =>", socket.handshake.query);

  // event NAME only: payloads can hold tokens / private chat text and must not end up in the logs
  socket.onAny((event) => {
    console.log("🔥 EVENT =>", event, "socket =>", socket.id);
  });

  const {
    loginUserId,
    hostId,
    isHost: rawIsHost,
  } = socket.handshake.auth || {};
  // socket clients may send the flag as a string: Boolean("false") would be TRUE
  const isHost = rawIsHost === true || rawIsHost === 1 || rawIsHost === "true" || rawIsHost === "1";

  const { globalRoom } =
    socket.handshake.query || {};

  if (!loginUserId) {
    console.warn(
      "❌ Missing loginUserId in socket auth"
    );

    socket.disconnect(true);
    return;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      loginUserId
    )
  ) {
    console.warn(
      "❌ Invalid loginUserId:",
      loginUserId
    );

    socket.disconnect(true);
    return;
  }

  const id =
    typeof globalRoom === "string"
      ? globalRoom.split(":")[1]
      : null;

  if (
    !globalRoom ||
    !id ||
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    console.warn(
      "❌ Invalid or missing globalRoom:",
      globalRoom
    );

    socket.disconnect(true);
    return;
  }

  // Authenticated activity heartbeat -> User/Host.lastActiveAt (throttled: max 1 write / 60s per account, in-memory).
  // `lastActiveAt` is only a timestamp; it is not a WATCH field so it never triggers realtime fan-out.
  {
    const HB_MS = 60 * 1000;
    let lastBeat = 0;
    const beat = () => {
      const now = Date.now();
      if (now - lastBeat < HB_MS) return;
      lastBeat = now;
      const M = socket.data.isHost ? Host : User;
      M.updateOne({ _id: id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
    };
    socket.onAny(beat);
  }

  socket.data.userId =
    loginUserId;

  socket.data.hostId =
    hostId || null;

  socket.data.isHost =
    Boolean(isHost);

  socket.data.globalRoom =
    globalRoom;

  console.log(
    "LOGIN USER =>",
    socket.data.userId
  );

  console.log(
    "HOST ID =>",
    socket.data.hostId
  );

  console.log(
    "IS HOST =>",
    socket.data.isHost
  );

  console.log(
    "GLOBAL ROOM =>",
    socket.data.globalRoom
  );

  if (!socket.rooms.has(globalRoom)) {
    socket.join(globalRoom);

    console.log(
      `Socket joined room: ${globalRoom}`
    );
  } else {
    console.log(
      `Socket already in room: ${globalRoom}`
    );
  }

  // Feed realtime (likes / comments / views / shares) — join/leave feed rooms
  registerFeedSocketHandlers(socket);

  const chatListRoom =
    `chatList:${loginUserId}`;

  if (!socket.rooms.has(chatListRoom)) {
    socket.join(chatListRoom);

    console.log(
      `Socket joined chat list room: ${chatListRoom}`
    );
  } else {
    console.log(
      `Socket already in chat list room: ${chatListRoom}`
    );
  }

  // LIVE handlers: registered for EVERY socket (host + viewer) BEFORE any role specific branch below
  // (a host used to `return` before reaching them, so hosts had no live comments / heartbeat / end).
  liveSocketHandlers.registerLiveSocketHandlers(io, socket);

  try {
    // `roleSetup`: host sockets finish their setup inside this block and `break` out of it. They must NOT
    // return from the connection handler, otherwise none of the handlers registered below would exist
    // for hosts (chat, calls, disconnect cleanup ...).
    roleSetup: {
    if (isHost) {
      const actualHostId =
        hostId || id;

      if (
        !mongoose.Types.ObjectId.isValid(
          actualHostId
        )
      ) {
        console.error(
          "❌ Invalid hostId:",
          actualHostId
        );

        socket.disconnect(true);
        return;
      }

      const host =
        await Host.findOne({
          _id: actualHostId,
          status: 2,
        })
          .select(
            "_id name image isOnline userId"
          )
          .lean();

      if (!host) {
        console.error(
          `❌ No active Host found for ID: ${actualHostId}`
        );

        socket.disconnect(true);
        return;
      }

      const wasOffline =
        host.isOnline !== true;

      const updateResult =
        await Host.updateOne(
          {
            _id: host._id,
          },
          {
            $set: {
              isOnline: true,
            },
          }
        );

      if (wasOffline) {
        try {
          console.log(
            "🚀 SENDING HOST ONLINE NOTIFICATION =>",
            host.name
          );

          await sendHostOnlineNotificationToUsers(
            host
          );
        } catch (error) {
          console.error(
            "❌ HOST ONLINE NOTIFICATION FCM ERROR:",
            error.code,
            error.message
          );
        }
      }

      await emitHostStatusUpdate(
        io,
        host._id
      );

      // Daily LIVE Task: join the host-only room + push the latest state
      require("./services/dailyTask.service").onHostSocketConnected(
        socket,
        host._id
      );

      // live in progress (host reconnected): back into the live room + cancel a pending "host left" end
      await liveSocketHandlers.restoreHostLiveRoom(io, socket, host._id);

      break roleSetup;
    }

    const user =
      await User.findById(loginUserId)
        .select("_id isOnline")
        .lean();

    if (!user) {
      console.error(
        `❌ No User found for ID: ${loginUserId}`
      );

      socket.disconnect(true);
      return;
    }

    console.log(
      "🔥 USER FOUND =>",
      user._id.toString()
    );

    console.log(
      "🔥 USER ONLINE BEFORE =>",
      user.isOnline
    );

    const wasOffline =
      user.isOnline !== true;

    const updateResult =
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            isOnline: true,
          },
        }
      );

    console.log(
      "🔥 USER ONLINE UPDATE RESULT =>",
      updateResult
    );

    console.log(
      `User ${user._id} is now online`
    );

    console.log(
      "🔥 USER WAS OFFLINE =>",
      wasOffline
    );

    if (wasOffline) {
      try {
        console.log(
          "🚀 SENDING USER ONLINE NOTIFICATION TO HOSTS =>",
          user._id.toString()
        );

        const notificationResult =
          await sendUserOnlineNotificationToHosts(
            user
          );

        console.log(
          "✅ USER ONLINE NOTIFICATION RESULT =>",
          notificationResult
        );
      } catch (error) {
        console.error(
          "❌ USER ONLINE NOTIFICATION FCM ERROR:",
          error.code,
          error.message
        );
      }
    } else {
      console.log(
        "ℹ️ USER ALREADY ONLINE => NOTIFICATION SKIPPED"
      );
    }
    } // end roleSetup

  } catch (error) {
    console.error(
      "❌ USER / HOST ONLINE ERROR:",
      error.code,
      error.message
    );

    socket.disconnect(true);
  }



  /// CHAT MESSEGE SENT 
  socket.on("chatMessageSent", async (data) => {
    let deductedCoins = 0;
    let adminShare = 0;
    let agencyShare = 0;
    let hostEarnings = 0;

    let sender = null;
    let receiver = null;
    let chatTopic = null;
    let agency = null;

    let coinDeductedSuccessfully = false;
    let hostCoinsAdded = false;
    let agencyCoinsAdded = false;

    try {
      const parseData =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      if (!parseData) return;

      const {
        senderId,
        receiverId,
        senderRole,
        receiverRole,
        chatTopicId,
        messageType,
      } = parseData;

      const type = Number(messageType);

      if (
        !senderId ||
        !receiverId ||
        !senderRole ||
        !receiverRole ||
        !chatTopicId ||
        ![1, 2, 3, 4].includes(type)
      ) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(senderId) ||
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        !mongoose.Types.ObjectId.isValid(chatTopicId)
      ) {
        return;
      }

      const senderType =
        String(senderRole).trim().toLowerCase();

      const receiverType =
        String(receiverRole).trim().toLowerCase();

      const senderQuery =
        senderType === "user"
          ? User.findById(senderId)
            .select(
              "_id name image coin spentCoins isVip fcmToken isBlock"
            )
            .lean()
          : Host.findById(senderId)
            .select(
              "_id name image coin isFake fcmToken isBlock"
            )
            .lean();

      const receiverQuery =
        receiverType === "host"
          ? Host.findById(receiverId)
            .select(
              "_id name image fcmToken isBlock coin chatRate agencyId userId"
            )
            .lean()
          : User.findById(receiverId)
            .select(
              "_id name image fcmToken isBlock coin"
            )
            .lean();

      const [
        uniqueId,
        senderData,
        receiverData,
        topicData,
      ] = await Promise.all([
        generateHistoryUniqueId(),
        senderQuery,
        receiverQuery,
        ChatTopic.findById(chatTopicId)
          .select(
            "_id senderId receiverId chatId messageCount"
          )
          .lean(),
      ]);

      sender = senderData;
      receiver = receiverData;
      chatTopic = topicData;

      if (!sender || !receiver || !chatTopic) {
        return;
      }

      const topicValid =
        (
          String(chatTopic.senderId) ===
          String(sender._id) &&
          String(chatTopic.receiverId) ===
          String(receiver._id)
        ) ||
        (
          String(chatTopic.senderId) ===
          String(receiver._id) &&
          String(chatTopic.receiverId) ===
          String(sender._id)
        );

      if (!topicValid) {
        return;
      }

      if (
        sender.isBlock === true ||
        receiver.isBlock === true
      ) {
        return;
      }

      const isUserToHost =
        senderType === "user" &&
        receiverType === "host";

      if (isUserToHost) {
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
          return;
        }

        let freeMessages = Number(
          settingJSON?.maxFreeChatMessages ?? 10
        );

        if (sender.isVip) {
          const vip =
            await VipPlanPrivilege.findOne()
              .select("freeMessages")
              .lean();

          if (vip?.freeMessages != null) {
            freeMessages =
              Number(vip.freeMessages);
          }
        }

        const messageCount =
          Number(chatTopic.messageCount || 0);

        const isFree =
          messageCount < freeMessages;

        let messageRate = 0;

        if (type === 1) {
          messageRate = Number(
            receiver.chatRate ??
            settingJSON?.chatRate ??
            10
          );
        }

        if (type === 2) {
          messageRate = 12;
        }

        if (type === 3) {
          messageRate = 16;
        }

        if (type === 4) {
          messageRate = Number(
            settingJSON?.giftChatRate ?? 10
          );
        }

        if (!isFree) {
          deductedCoins = Number(
            messageRate.toFixed(2)
          );

          if (deductedCoins <= 0) {
            return;
          }

          const commissionRate =
            Number(
              settingJSON?.adminCommissionRate ?? 50
            );

          adminShare = Number(
            (
              deductedCoins *
              commissionRate /
              100
            ).toFixed(2)
          );

          const hostPool =
            Number(
              (
                deductedCoins -
                adminShare
              ).toFixed(2)
            );

          hostEarnings = hostPool;

          if (
            receiver.agencyId &&
            mongoose.Types.ObjectId.isValid(
              receiver.agencyId
            )
          ) {
            agency =
              await Agency.findById(
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
              agencyShare =
                Number(
                  (
                    hostPool *
                    Number(
                      agency.commission || 0
                    ) /
                    100
                  ).toFixed(2)
                );

              hostEarnings =
                Number(
                  (
                    hostPool -
                    agencyShare
                  ).toFixed(2)
                );
            }
          }

          // console.log(
          //   "💰 CHAT COIN MANAGEMENT",
          //   {
          //     userId:
          //       sender._id.toString(),
          //     deductedCoins,
          //     adminCoins:
          //       adminShare,
          //     hostCoins:
          //       hostEarnings,
          //     agencyCoins:
          //       agencyShare,
          //   }
          // );

          const deduction =
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

          if (
            deduction.modifiedCount !== 1
          ) {
            // console.log(
            //   "💰 CHAT COIN MANAGEMENT | INSUFFICIENT",
            //   {
            //     userId:
            //       sender._id.toString(),
            //     required:
            //       deductedCoins,
            //   }
            // );

            io.to(
              `globalRoom:${sender._id}`
            ).emit(
              "insufficientCoins",
              "Insufficient coins to send message."
            );

            return;
          }

          coinDeductedSuccessfully =
            true;

          // console.log(
          //   "💰 CHAT COIN MANAGEMENT | DEDUCTED",
          //   {
          //     userId:
          //       sender._id.toString(),
          //     coins:
          //       deductedCoins,
          //   }
          // );
        }
      }

      let message = "";

      let image = {
        key: "",
        url: "",
      };

      let audio = {
        key: "",
        url: "",
      };

      if (type === 1) {
        message =
          typeof parseData.message === "string"
            ? parseData.message.trim()
            : "";

        if (!message) {
          throw new Error(
            "Message is required."
          );
        }
      }

      if (type === 2) {
        image = getMediaObject(
          parseData.image ||
          parseData.media ||
          parseData.message
        );

        if (!image.key && !image.url) {
          throw new Error(
            "Image is required."
          );
        }
      }

      if (type === 3) {
        audio = getMediaObject(
          parseData.audio ||
          parseData.media ||
          parseData.message
        );

        if (!audio.key && !audio.url) {
          throw new Error(
            "Audio is required."
          );
        }
      }

      if (type === 4) {
        message =
          typeof parseData.message === "string"
            ? parseData.message.trim()
            : "";
      }

      const chat =
        await Chat.create({
          messageType: type,
          senderId: sender._id,
          message,
          chatTopicId: chatTopic._id,
          image,
          audio,
          date: new Date(),
        });

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
        const hostUpdate =
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
          hostUpdate.modifiedCount !== 1
        ) {
          throw new Error(
            "Host earning update failed."
          );
        }

        hostCoinsAdded = true;

        if (
          agency &&
          agencyShare > 0
        ) {
          const agencyUpdate =
            await Agency.updateOne(
              {
                _id: agency._id,
              },
              {
                $inc: {
                  hostCoins:
                    hostEarnings,
                  totalEarnings:
                    agencyShare,
                  netAvailableEarnings:
                    agencyShare,
                  totalEarningsWithCommissionAndHostCoin:
                    hostEarnings +
                    agencyShare,
                },
              }
            );

          if (
            agencyUpdate.modifiedCount !== 1
          ) {
            throw new Error(
              "Agency earning update failed."
            );
          }

          agencyCoinsAdded = true;
        }

        await History.create({
          uniqueId,
          type: 9,
          userId:
            senderType === "user"
              ? sender._id
              : null,
          hostId:
            receiverType === "host"
              ? receiver._id
              : null,
          agencyId:
            receiver.agencyId || null,
          userCoin:
            deductedCoins,
          hostCoin:
            hostEarnings,
          adminCoin:
            adminShare,
          agencyCoin:
            agencyShare,
          date: new Date(),
        });

        // console.log(
        //   "💰 CHAT COIN MANAGEMENT | ACCOUNTING SAVED",
        //   {
        //     user:
        //       deductedCoins,
        //     admin:
        //       adminShare,
        //     host:
        //       hostEarnings,
        //     agency:
        //       agencyShare,
        //   }
        // );
      }

      const savedChat =
        await Chat.findById(
          chat._id
        ).lean();

      const eventData = {
        _id:
          savedChat._id.toString(),

        senderId:
          sender._id.toString(),

        receiverId:
          receiver._id.toString(),

        senderRole:
          senderType,

        receiverRole:
          receiverType,

        chatTopicId:
          savedChat.chatTopicId.toString(),

        messageType:
          Number(savedChat.messageType),

        message:
          savedChat.message || "",

        image:
          getMediaObject(
            savedChat.image
          ),

        audio:
          getMediaObject(
            savedChat.audio
          ),

        date:
          savedChat.date,

        createdAt:
          savedChat.createdAt,
      };

      const senderRoom =
        `globalRoom:${sender._id}`;

      const receiverRoom =
        `globalRoom:${receiver._id}`;

      io.to(senderRoom).emit(
        "chatMessageSent",
        eventData
      );

      if (
        receiverRoom !== senderRoom
      ) {
        io.to(receiverRoom).emit(
          "chatMessageSent",
          eventData
        );
      }


      // await emitChatListUpdate({
      //   io,
      //   userId: sender._id,
      //   otherUserId: receiver._id,
      //   chatTopic,
      //   chat: savedChat,
      // });
      await emitChatListUpdate({
        io,
        userId: sender._id,
        otherUserId: receiver._id,
        otherUserRole: receiverRole,
        chatTopic,
        chat: savedChat,
      });
      await emitChatListUpdate({
        io,
        userId: receiver._id,
        otherUserId: sender._id,
        otherUserRole: senderRole,
        chatTopic,

        chat: savedChat,
      });


      if (
        receiver.fcmToken &&
        typeof receiver.fcmToken ===
        "string" &&
        receiver.fcmToken.trim()
      ) {
        let notificationBody =
          eventData.message;

        if (type === 2) {
          notificationBody =
            "📷 Sent an image";
        }

        if (type === 3) {
          notificationBody =
            "🎤 Sent an audio message";
        }

        if (!notificationBody) {
          notificationBody =
            "🗨️ New message";
        }

        try {
          const notificationTitle =
            `${sender.name || "Someone"} sent you a message`;
          let senderImage =
            typeof sender.image === "string"
              ? sender.image
              : sender.image?.url || "";

          if (
            senderImage &&
            !senderImage.startsWith("http://") &&
            !senderImage.startsWith("https://")
          ) {
            senderImage =
              `https://zigo-live-media.stackearn.com/${senderImage.replace(/^\/+/, "")}`;
          }

          console.log("SENDER PROFILE IMAGE =>", senderImage);


          const fcmMessage = {
            token:
              receiver.fcmToken.trim(),

            notification: {
              title:
                notificationTitle,
              body:
                notificationBody,
            },


            data: {
              title: notificationTitle,
              body: notificationBody,
              type: "CHAT",
              senderId: String(sender._id),
              receiverId: String(receiver._id),
              chatTopicId: String(chatTopic._id),
              messageId: String(chat._id),
              senderRole: String(senderRole || ""),
              receiverRole: String(receiverRole || ""),
              senderImage: senderImage,
              messageType: String(type),
            },

            android: {
              priority:
                "high",
              notification: {
                channelId:
                  "zigo_default",
                sound:
                  "default",
              },
            },

            apns: {
              payload: {
                aps: {
                  sound:
                    "default",
                },
              },
            },
          };

          await admin.messaging.send(
            fcmMessage
          );

          console.log(
            "CHAT FCM SENT"
          );
        } catch (error) {
          if (
            error?.code ===
            "messaging/registration-token-not-registered" ||
            error?.code ===
            "messaging/invalid-registration-token"
          ) {
            await Promise.allSettled([
              User.updateOne(
                {
                  _id:
                    receiverType === "user"
                      ? receiver._id
                      : null,
                  fcmToken:
                    receiver.fcmToken,
                },
                {
                  $set: {
                    fcmToken: "",
                  },
                }
              ),

              Host.updateOne(
                {
                  _id:
                    receiverType === "host"
                      ? receiver._id
                      : null,
                  fcmToken:
                    receiver.fcmToken,
                },
                {
                  $set: {
                    fcmToken: "",
                  },
                }
              ),
            ]);

            console.log(
              "CHAT FCM TOKEN CLEARED"
            );
          } else {
            console.log(
              "CHAT FCM FAILED | MESSAGE ALREADY SAVED",
              error.code ||
              "UNKNOWN",
              error.message ||
              ""
            );
          }
        }
      }

    } catch (error) {
      console.log(
        "CHAT ERROR:",
        error.message
      );

      if (
        coinDeductedSuccessfully &&
        sender &&
        deductedCoins > 0
      ) {
        await User.updateOne(
          {
            _id: sender._id,
          },
          {
            $inc: {
              coin:
                deductedCoins,
              spentCoins:
                -deductedCoins,
            },
          }
        );

        // console.log(
        //   "💰 CHAT COIN MANAGEMENT | ROLLBACK USER",
        //   deductedCoins
        // );
      }

      if (
        hostCoinsAdded &&
        receiver &&
        hostEarnings > 0
      ) {
        await Host.updateOne(
          {
            _id: receiver._id,
          },
          {
            $inc: {
              coin:
                -hostEarnings,
            },
          }
        );

        console.log(
          "💰 CHAT COIN MANAGEMENT | ROLLBACK HOST",
          hostEarnings
        );
      }

      if (
        agencyCoinsAdded &&
        agency &&
        agencyShare > 0
      ) {
        const total =
          Number(
            (
              hostEarnings +
              agencyShare
            ).toFixed(2)
          );

        await Agency.updateOne(
          {
            _id: agency._id,
          },
          {
            $inc: {
              hostCoins:
                -hostEarnings,
              totalEarnings:
                -agencyShare,
              netAvailableEarnings:
                -agencyShare,
              totalEarningsWithCommissionAndHostCoin:
                -total,
            },
          }
        );

        console.log(
          "💰 CHAT COIN MANAGEMENT | ROLLBACK AGENCY",
          agencyShare
        );
      }
    }
  });

  socket.on("chatGiftSent", async (data) => {
    try {
      const parseData =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      const {
        chatTopicId,
        senderId,
        receiverId,
        senderRole,
        receiverRole,
        giftId,
        giftCount,
      } = parseData || {};

      if (
        !chatTopicId ||
        !senderId ||
        !receiverId ||
        !giftId
      ) {
        console.error(
          "❌ [chatGiftSent] Missing required fields."
        );
        return;
      }

      // =========================================================
      // GET SENDER / RECEIVER
      // =========================================================

      const senderPromise =
        senderRole === "user"
          ? User.findById(senderId)
            .select("_id name coin image")
            .lean()
          : Host.findById(senderId)
            .select("_id name coin image")
            .lean();

      const receiverPromise =
        receiverRole === "host"
          ? Host.findById(receiverId)
            .select(
              "_id fcmToken isBlock coin agencyId name image"
            )
            .lean()
          : User.findById(receiverId)
            .select(
              "_id fcmToken isBlock coin name image"
            )
            .lean();

      const [
        uniqueId,
        sender,
        receiver,
        chatTopic,
        gift,
      ] = await Promise.all([
        generateHistoryUniqueId(),

        senderPromise,

        receiverPromise,

        ChatTopic.findById(chatTopicId)
          .select(
            "_id senderId receiverId chatId"
          )
          .lean(),

        Gift.findById(giftId)
          .select(
            "_id coin imageUrl imageKey svgaImageUrl svgaImageKey type"
          )
          .lean(),
      ]);

      if (
        !sender ||
        !receiver ||
        !chatTopic ||
        !gift
      ) {
        console.error(
          "❌ [chatGiftSent] Sender / receiver / topic / gift not found."
        );
        return;
      }


      const count = Math.max(
        1,
        Number(giftCount || 1)
      );

      const giftPrice =
        Number(gift.coin || 0);

      const totalGiftCost =
        Number(
          (
            giftPrice * count
          ).toFixed(2)
        );

      if (totalGiftCost <= 0) {
        console.error(
          "❌ [chatGiftSent] Invalid gift cost."
        );
        return;
      }


      const userCoin =
        Number(sender.coin || 0);

      if (
        userCoin < totalGiftCost
      ) {
        io.to(
          `globalRoom:${sender._id}`
        ).emit(
          "insufficientCoins",
          "Insufficient coins to send gift."
        );

        return;
      }


      const adminRate =
        Number(
          settingJSON?.adminCommissionRate || 0
        );

      const adminCoins =
        Number(
          (
            (totalGiftCost *
              adminRate) /
            100
          ).toFixed(2)
        );

      const hostGross =
        Number(
          (
            totalGiftCost -
            adminCoins
          ).toFixed(2)
        );


      let agencyCoins = 0;
      let agencyRate = 0;
      let agency = null;

      if (receiver.agencyId) {
        agency =
          await Agency.findById(
            receiver.agencyId
          )
            .select(
              "_id commissionType commission"
            )
            .lean();

        if (agency) {
          if (
            Number(
              agency.commissionType
            ) === 1
          ) {
            agencyRate =
              Number(
                agency.commission || 0
              );

            agencyCoins =
              Number(
                (
                  (hostGross *
                    agencyRate) /
                  100
                ).toFixed(2)
              );
          }
        }
      }

      const hostCoins =
        Number(
          (
            hostGross -
            agencyCoins
          ).toFixed(2)
        );

      const giftImage =
        gift.imageUrl ||
          gift.imageKey
          ? {
            url: getMediaUrl(
              gift.imageUrl || "",
              gift.imageKey || ""
            ),
            key:
              gift.imageKey || "",
          }
          : null;

      const giftSvgaImage =
        gift.svgaImageUrl ||
          gift.svgaImageKey
          ? {
            url: getMediaUrl(
              gift.svgaImageUrl || "",
              gift.svgaImageKey || ""
            ),
            key:
              gift.svgaImageKey || "",
          }
          : null;

      const senderImage =
        sender.image &&
          typeof sender.image === "object"
          ? {
            url:
              getImageUrl(
                sender.image.url || "",
                sender.image.key || ""
              ),
            key:
              sender.image.key || "",
          }
          : null;

      const userUpdate =
        await User.updateOne(
          {
            _id: sender._id,
            coin: {
              $gte: totalGiftCost,
            },
          },
          {
            $inc: {
              coin:
                -totalGiftCost,

              spentCoins:
                totalGiftCost,
            },
          }
        );

      if (
        userUpdate.modifiedCount !== 1
      ) {
        io.to(
          `globalRoom:${sender._id}`
        ).emit(
          "insufficientCoins",
          "Insufficient coins to send gift."
        );

        return;
      }

      // =========================================================
      // IMPORTANT:
      // ONE TIMESTAMP FOR THIS GIFT
      //
      // DO NOT CONVERT TO IST / USA / UK HERE.
      //
      // MongoDB stores Date internally as UTC.
      // Frontend will convert to user's local timezone.
      // =========================================================

      const giftDate = new Date();

      // =========================================================
      // CHAT DATA
      // =========================================================

      const chatData = {
        messageType: 4,

        message:
          `🎁 ${sender.name || "User"} sent a gift`,

        senderId:
          sender._id,

        chatTopicId:
          chatTopic._id,

        giftCount:
          count,

        giftType:
          gift.type || 1,

        // MongoDB Date
        date:
          giftDate,

        isRead:
          false,
      };

      if (senderImage) {
        chatData.image =
          senderImage;
      }

      if (giftImage) {
        chatData.giftImage =
          giftImage;
      }

      if (giftSvgaImage) {
        chatData.giftsvgaImage =
          giftSvgaImage;
      }

      const chat =
        new Chat(chatData);


      const operations = [
        chat.save(),

        ChatTopic.updateOne(
          {
            _id:
              chatTopic._id,
          },
          {
            $set: {
              chatId:
                chat._id,
            },
          }
        ),


        Host.updateOne(
          {
            _id: receiver._id,
          },
          {
            $inc: {
              coin: hostCoins,
              totalGifts: count,
            },
          }
        ),
        History.create({
          uniqueId:
            uniqueId,

          type:
            10,

          userId:
            sender._id,

          hostId:
            receiver._id,

          agencyId:
            receiver.agencyId ||
            null,

          giftId:
            gift._id,

          giftCoin:
            giftPrice,

          giftImage:
            giftImage?.url || "",

          giftsvgaImage:
            giftSvgaImage?.url || "",

          giftType:
            gift.type || 1,

          giftCount:
            count,

          userCoin:
            totalGiftCost,

          hostCoin:
            hostCoins,

          adminCoin:
            adminCoins,

          agencyCoin:
            agencyCoins,

          // Same exact Date
          date:
            giftDate,
        }),
      ];

      // =========================================================
      // AGENCY UPDATE
      // =========================================================

      if (
        agency &&
        agencyCoins > 0
      ) {
        operations.push(
          Agency.updateOne(
            {
              _id:
                agency._id,
            },
            {
              $inc: {
                hostCoins:
                  hostGross,

                totalEarnings:
                  agencyCoins,

                netAvailableEarnings:
                  agencyCoins,

                totalEarningsWithCommissionAndHostCoin:
                  hostGross +
                  agencyCoins,
              },
            }
          )
        );
      }

      await Promise.all(
        operations
      );

      // =========================================================
      // SOCKET EVENT
      // =========================================================

      const eventData = {
        data: JSON.stringify({
          ...parseData,

          giftCount:
            String(count),

          giftUrl:
            giftImage?.url || "",

          giftImage:
            giftImage,

          giftsvgaImage:
            giftSvgaImage,

          userName:
            sender.name || "",

          userImage:
            senderImage?.url || "",

          isOnline:
            Boolean(
              parseData?.isOnline
            ),


          date:
            giftDate.toISOString(),
        }),

        messageId:
          chat._id.toString(),
      };


      io.to(
        `globalRoom:${chatTopic.senderId}`
      ).emit(
        "chatGiftSent",
        eventData
      );

      io.to(
        `globalRoom:${chatTopic.receiverId}`
      ).emit(
        "chatGiftSent",
        eventData
      );


      await emitChatListUpdate({
        io,
        userId: sender._id,
        otherUserId: receiver._id,
        otherUserRole: receiverRole,
        chatTopic,
        chat,
      });

      await emitChatListUpdate({
        io,
        userId: receiver._id,
        otherUserId: sender._id,
        otherUserRole: senderRole,
        chatTopic,
        chat,
      });


      if (
        receiver.fcmToken &&
        typeof receiver.fcmToken === "string" &&
        receiver.fcmToken.trim() &&
        !receiver.isBlock
      ) {
        try {
          const notificationTitle =
            `${sender.name || "Someone"} sent you a gift 🎁`;

          let senderImage =
            typeof sender.image === "string"
              ? sender.image
              : sender.image?.url || "";

          if (
            senderImage &&
            !senderImage.startsWith("http://") &&
            !senderImage.startsWith("https://")
          ) {
            senderImage =
              `https://zigo-live-media.stackearn.com/${senderImage.replace(/^\/+/, "")}`;
          }

          console.log("SENDER PROFILE IMAGE =>", senderImage);



          const notificationBody =
            `💝 You received ${count} gift${count > 1 ? "s" : ""} worth ${totalGiftCost} coins!`;

          await admin.messaging.send({
            token: receiver.fcmToken.trim(),

            notification: {
              title: notificationTitle,
              body: notificationBody,
            },

            data: {
              title: notificationTitle,
              body: notificationBody,
              type: "GIFT",
              giftCount: String(count),
              senderId: String(sender._id),
              receiverId: String(receiver._id),
              chatTopicId: String(chatTopic._id),
              messageId: String(chat._id),
              userName: String(sender.name || ""),
              userImage: String(senderImage?.url || ""),
              senderRole: String(senderRole || ""),
              senderImage: String(senderImage || ""),
              receiverRole: String(receiverRole || ""),
              giftId: String(gift._id),
              giftCoin: String(giftPrice),
              totalGiftCost: String(totalGiftCost),
              date: giftDate.toISOString(),
            },

            android: {
              priority: "high",
              notification: {
                channelId: "zigo_default",
                sound: "default",
              },
            },

            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          });

          console.log("🎁 GIFT FCM SENT", {
            receiverId: String(receiver._id),
            giftCount: count,
            totalGiftCost,
          });
        } catch (error) {
          console.error(
            "🎁 GIFT FCM FAILED",
            error.code || "UNKNOWN",
            error.message || error
          );
        }
      }




      console.log(
        `🎁 GIFT BILLING | Total: ${totalGiftCost} | Admin: ${adminCoins} (${adminRate}%) | Host Gross: ${hostGross} | Host Net: ${hostCoins} | Agency: ${agencyCoins} (${agencyRate}%)`
      );

      console.log(
        "🎁 Gift UTC Date:",
        giftDate.toISOString()
      );

      // =========================================================
      // FCM
      // =========================================================

      if (
        receiver.fcmToken &&
        !receiver.isBlock
      ) {
        try {
          admin
            .messaging
            .send({
              token:
                receiver.fcmToken,

              data: {
                title:
                  `${sender.name || "Someone"} sent you a gift 🎁`,

                body:
                  `💝 You received ${count} gifts worth ${totalGiftCost} coins!`,

                type:
                  "GIFT",

                giftCount:
                  String(count),

                senderId:
                  String(sender._id),

                receiverId:
                  String(receiver._id),

                userName:
                  String(
                    sender.name || ""
                  ),

                userImage:
                  String(
                    senderImage?.url || ""
                  ),

                hostName:
                  String(
                    receiver.name || ""
                  ),

                hostImage:
                  String(
                    receiver.image?.url ||
                    ""
                  ),

                senderRole:
                  String(
                    senderRole || ""
                  ),

                // UTC ISO timestamp
                date:
                  giftDate.toISOString(),
              },
            });
        } catch (error) {
          console.error(
            "Gift FCM Error:",
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "chatGiftSent Error:",
        error
      );
    }
  });

  socket.on("chatMessageSeen", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("🔹 Data in chatMessageSeen event:", parsedData);

      const updated = await Chat.findByIdAndUpdate(parsedData.messageId, { $set: { isRead: true } }, { new: true, lean: true, select: "_id isRead" });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);
      }
    } catch (error) {
      console.error("Error updating chatMessageSeen:", error);
    }
  });
  //private video call
  socket.on("callRinging", async (data) => {
    let callerId = null;
    let receiverId = null;
    let callId = null;

    try {
      const parsedData =
        typeof data === "string" ? JSON.parse(data) : data;

      callerId = parsedData?.callerId;
      receiverId = parsedData?.receiverId;

      const {
        agoraUID,
        channel,
        callType,
        callerRole,
        receiverRole,
        audioCallCharge,
        videoCallCharge,
        isFollow,
      } = parsedData || {};

      const callerType =
        String(callerRole || "").trim().toLowerCase();

      const receiverType =
        String(receiverRole || "").trim().toLowerCase();

      const type =
        String(callType || "").trim().toLowerCase();

      if (
        !mongoose.Types.ObjectId.isValid(callerId) ||
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        !channel ||
        !["audio", "video"].includes(type) ||
        !["user", "host"].includes(callerType) ||
        !["user", "host"].includes(receiverType)
      ) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Invalid call details.",
        });
      }

      const CallerModel =
        callerType === "user" ? User : Host;

      const ReceiverModel =
        receiverType === "user" ? User : Host;

      const callerObjectId =
        new mongoose.Types.ObjectId(callerId);

      const receiverObjectId =
        new mongoose.Types.ObjectId(receiverId);

      const [caller, receiver] = await Promise.all([
        CallerModel.findById(callerObjectId)
          .select(
            "_id name image isBlock isBusy callId isOnline uniqueId fcmToken"
          )
          .lean(),

        ReceiverModel.findById(receiverObjectId)
          .select(
            "_id name image isBlock isBusy callId isOnline uniqueId fcmToken"
          )
          .lean(),
      ]);

      if (!caller) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Caller not found.",
        });
      }

      if (!receiver) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Receiver not found.",
        });
      }

      if (caller.isBlock) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Caller is blocked.",
        });
      }

      if (receiver.isBlock) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Receiver is blocked.",
        });
      }

      if (caller.isBusy) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "User is already busy.",
          isBusy: true,
        });
      }

      if (receiver.isBusy) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Host is already busy.",
          isBusy: true,
        });
      }

      if (!receiver.isOnline) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Receiver is not online.",
          isOnline: false,
        });
      }

      if (caller.callId) {
        await CallerModel.updateOne(
          { _id: callerObjectId },
          { $set: { callId: null } }
        );
      }

      if (receiver.callId) {
        await ReceiverModel.updateOne(
          { _id: receiverObjectId },
          { $set: { callId: null } }
        );
      }

      const uniqueId = await generateHistoryUniqueId();

      if (!uniqueId || !String(uniqueId).trim()) {
        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Unable to create call.",
        });
      }

      const callHistory = new History({
        uniqueId: String(uniqueId),

        type: type === "audio" ? 11 : 12,

        callType: type,

        isPrivate: true,

        userId:
          callerType === "user"
            ? caller._id
            : receiverType === "user"
              ? receiver._id
              : null,

        hostId:
          callerType === "host"
            ? caller._id
            : receiverType === "host"
              ? receiver._id
              : null,

        callConnect: false,

        date: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      });

      callId = callHistory._id.toString();

      // const chatTopic = await ChatTopic.findById(chatTopicId)
      //   .select("_id senderId receiverId chatId")
      //   .lean();

      // if (!chatTopic) {
      //   return io.to(`globalRoom:${callerId}`).emit("callRinging", {
      //     status: false,
      //     message: "Chat topic not found.",
      //   });
      // }

      const [callerLock, receiverLock] =
        await Promise.all([
          CallerModel.updateOne(
            {
              _id: callerObjectId,
              isBlock: false,
              isBusy: false,
            },
            {
              $set: {
                isBusy: true,
                callId,
              },
            }
          ),

          ReceiverModel.updateOne(
            {
              _id: receiverObjectId,
              isBlock: false,
              isBusy: false,
            },
            {
              $set: {
                isBusy: true,
                callId,
              },
            }
          ),
        ]);

      if (
        callerLock.modifiedCount !== 1 ||
        receiverLock.modifiedCount !== 1
      ) {
        await Promise.all([
          CallerModel.updateOne(
            {
              _id: callerObjectId,
              callId,
            },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),

          ReceiverModel.updateOne(
            {
              _id: receiverObjectId,
              callId,
            },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),
        ]);

        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Call setup failed.",
          isBusy: true,
        });
      }

      let token;

      try {
        token = RtcTokenBuilder.buildTokenWithUid(
          settingJSON.agoraAppId,
          settingJSON.agoraAppCertificate,
          channel,
          Number(agoraUID) || 0,
          RtcRole.PUBLISHER,
          Math.floor(Date.now() / 1000) + 86400
        );
      } catch (error) {
        await Promise.all([
          CallerModel.updateOne(
            { _id: callerObjectId, callId },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),

          ReceiverModel.updateOne(
            { _id: receiverObjectId, callId },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),
        ]);

        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Unable to create Agora token.",
        });
      }

      const callData = {
        status: true,
        callId,
        callType: type,
        callMode: "private",

        callerId: callerObjectId.toString(),
        receiverId: receiverObjectId.toString(),

        callerRole,
        receiverRole,

        callerName: caller.name || "",
        callerImage: caller.image || "",
        callerUniqueId: caller.uniqueId || "",

        receiverName: receiver.name || "",
        receiverImage: receiver.image || "",
        receiverUniqueId: receiver.uniqueId || "",

        token,
        channel,

        audioCallCharge: Number(audioCallCharge || 0),
        videoCallCharge: Number(videoCallCharge || 0),

        isFollow: Boolean(isFollow),
      };

      try {
        await callHistory.save();

        await Privatecall.create({
          caller: callerObjectId,
          receiver: receiverObjectId,
          callId,
        });



      } catch (error) {
        await Promise.all([
          CallerModel.updateOne(
            { _id: callerObjectId, callId },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),

          ReceiverModel.updateOne(
            { _id: receiverObjectId, callId },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),
        ]);

        console.error("Call save error:", error);

        return io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Unable to create call.",
        });
      }

      io.to(`globalRoom:${receiverId}`).emit(
        "callIncoming",
        callData
      );

      io.to(`globalRoom:${callerId}`).emit(
        "callConnected",
        callData
      );



      // if (
      //   receiver.fcmToken &&
      //   typeof receiver.fcmToken === "string" &&
      //   receiver.fcmToken.trim()
      // ) {
      //   try {
      //     if (
      //       receiver?.fcmToken &&
      //       typeof receiver.fcmToken === "string" &&
      //       receiver.fcmToken.trim().length > 0
      //     ) {
      //       const notificationTitle =
      //         `${sender.name || "Someone"} sent you a message`;

      //       const notificationBody =
      //         body || "🗨️ New message";

      //       await admin.messaging.send({
      //         token: receiver.fcmToken,

      //         data: {
      //           title: notificationTitle,

      //           body: notificationBody,

      //           type: "CHAT",

      //           senderId:
      //             String(sender._id),

      //           receiverId:
      //             String(receiver._id),

      //           chatTopicId:
      //             String(chatTopic._id),

      //           messageId:
      //             String(chat._id),

      //           senderRole:
      //             String(senderRole || ""),

      //           receiverRole:
      //             String(receiverRole || ""),

      //           messageType:
      //             String(type || ""),

      //           userName:
      //             String(sender.name || ""),

      //           userImage:
      //             String(senderImage?.url || ""),

      //           date:
      //             new Date().toISOString(),
      //         },
      //       });

      //       console.log(
      //         "CHAT FCM SENT:",
      //         {
      //           receiverId: String(receiver._id),
      //           title: notificationTitle,
      //           body: notificationBody,
      //         }
      //       );
      //     }
      //   } catch (error) {
      //     console.error(
      //       "CHAT FCM ERROR:",
      //       error.code,
      //       error.message
      //     );
      //   }
      // }


      if (
        receiver.fcmToken &&
        typeof receiver.fcmToken === "string" &&
        receiver.fcmToken.trim()
      ) {
        try {
          const notificationTitle =
            `${caller.name || "Someone"} is calling you 📞`;


          const notificationBody =
            type === "video"
              ? "📹 Incoming video call"
              : "📞 Incoming audio call";

          await admin.messaging.send({
            token: receiver.fcmToken.trim(),

            notification: {
              title: notificationTitle,
              body: notificationBody,
            },

            data: {
              title: notificationTitle,
              body: notificationBody,
              type: "CALL",
              callType: type,
              callMode: "private",
              callId: String(callId),
              callerId: String(caller._id),
              receiverId: String(receiver._id),
              callerRole: String(callerRole || ""),
              receiverRole: String(receiverRole || ""),
              callerName: String(caller.name || ""),
              senderImage: String(
                caller.image?.url ||
                caller.image ||
                ""
              ),
              callerUniqueId: String(caller.uniqueId || ""),
              channel: String(channel || ""),
              agoraUID: String(agoraUID || ""),
              date: new Date().toISOString(),
            },

            android: {
              priority: "high",
              notification: {
                channelId: "zigo_default",
                sound: "default",
              },
            },

            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          });

          console.log("📞 CALL FCM SENT", {
            receiverId: String(receiver._id),
            callerId: String(caller._id),
            callId: String(callId),
            callType: type,
          });
        } catch (error) {
          console.error(
            "📞 CALL FCM ERROR",
            error.code || "UNKNOWN",
            error.message || error
          );
        }
      }

      console.log(
        `CALL STARTED | ${callId} | ${caller.name || callerId} -> ${receiver.name || receiverId} | ${type}`
      );
    } catch (error) {
      console.error("callRinging Error:", error);

      if (callerId) {
        io.to(`globalRoom:${callerId}`).emit("callRinging", {
          status: false,
          message: "Unable to start call.",
        });
      }
    }
  });

  socket.on("callResponseHandled", async (data) => {
    try {
      const d =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      const {
        callerId,
        receiverId,
        callId,
        isAccept,
        callType,
        callerRole,
        receiverRole,
        audioCallCharge,
        videoCallCharge,
        isFollow,
        token,
        channel,
      } = d || {};

      if (
        !callerId ||
        !receiverId ||
        !callId
      ) {
        return;
      }

      const callerType =
        String(callerRole || "")
          .trim()
          .toLowerCase();

      const receiverType =
        String(receiverRole || "")
          .trim()
          .toLowerCase();

      const type =
        String(callType || "")
          .trim()
          .toLowerCase();

      const CallerModel =
        callerType === "user"
          ? User
          : Host;

      const ReceiverModel =
        receiverType === "host"
          ? Host
          : User;

      const callerRoom =
        `globalRoom:${callerId}`;

      const receiverRoom =
        `globalRoom:${receiverId}`;

      const [
        caller,
        receiver,
        history,
      ] = await Promise.all([
        CallerModel.findById(callerId)
          .select(
            "_id name image uniqueId isBusy callId"
          )
          .lean(),

        ReceiverModel.findById(receiverId)
          .select(
            "_id name image uniqueId isBusy callId"
          )
          .lean(),

        History.findById(callId),
      ]);

      if (
        !caller ||
        !receiver ||
        !history
      ) {
        io.to(callerRoom).emit(
          "callResponseHandled",
          {
            status: false,
            message: "Call not found.",
          }
        );

        return;
      }

      if (!isAccept) {
        history.callConnect = false;

        await Promise.all([
          history.save(),

          CallerModel.updateOne(
            {
              _id: caller._id,
              callId: callId,
            },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),

          ReceiverModel.updateOne(
            {
              _id: receiver._id,
              callId: callId,
            },
            {
              $set: {
                isBusy: false,
                callId: null,
              },
            }
          ),

          Privatecall.deleteOne({
            caller: caller._id,
            receiver: receiver._id,
          }),
        ]);

        const rejectData = {
          status: true,
          isAccept: false,

          callerId:
            caller._id.toString(),

          receiverId:
            receiver._id.toString(),

          callId:
            callId.toString(),

          callType: type,

          callMode: "private",

          callerRole,
          receiverRole,

          callerName:
            String(caller.name || ""),

          callerImage:
            String(
              getMediaUrl(
                caller.image || ""
              )
            ),

          callerUniqueId:
            String(
              caller.uniqueId || ""
            ),

          receiverName:
            String(receiver.name || ""),

          receiverImage:
            String(
              getMediaUrl(
                receiver.image || ""
              )
            ),

          receiverUniqueId:
            String(
              receiver.uniqueId || ""
            ),
        };

        io.to(callerRoom).emit(
          "callRejected",
          rejectData
        );

        io.to(receiverRoom).emit(
          "callRejected",
          rejectData
        );

        await createCallChat({
          callerId,
          receiverId,
          callId,
          callType: type,
          callStatus: 2,
        });

        console.log(
          `CALL REJECTED | ${callId}`
        );

        return;
      }
      history.callConnect = true;
      history.callStartTime = new Date();

      await Promise.all([
        history.save(),

        Privatecall.deleteOne({
          caller: caller._id,
          receiver: receiver._id,
        }),
      ]);

      const callerSockets =
        await io
          .in(callerRoom)
          .fetchSockets();

      const receiverSockets =
        await io
          .in(receiverRoom)
          .fetchSockets();

      for (
        const callerSocket
        of callerSockets
      ) {
        callerSocket.join(callId);
      }

      for (
        const receiverSocket
        of receiverSockets
      ) {
        receiverSocket.join(callId);
      }

      const callData = {
        status: true,
        isAccept: true,

        callerId:
          caller._id.toString(),

        receiverId:
          receiver._id.toString(),

        callId:
          callId.toString(),

        callType: type,

        callMode: "private",

        callerRole,
        receiverRole,

        callerName:
          String(caller.name || ""),

        callerImage:
          String(
            getMediaUrl(
              caller.image || ""
            )
          ),

        callerUniqueId:
          String(
            caller.uniqueId || ""
          ),

        receiverName:
          String(receiver.name || ""),

        receiverImage:
          String(
            getMediaUrl(
              receiver.image || ""
            )
          ),

        receiverUniqueId:
          String(
            receiver.uniqueId || ""
          ),

        token:
          String(token || ""),

        channel:
          String(channel || ""),

        audioCallCharge:
          Number(
            audioCallCharge || 0
          ),

        videoCallCharge:
          Number(
            videoCallCharge || 0
          ),

        isFollow:
          Boolean(isFollow),
      };

      io.to(callerRoom).emit(
        "onAcceptCall",
        callData
      );

      io.to(callerRoom).emit(
        "callAnswerReceived",
        callData
      );

      io.to(receiverRoom).emit(
        "callAnswerReceived",
        callData
      );

      io.to(callId).emit(
        "callAnswerReceived",
        callData
      );
      console.log(
        `CALL DDAGA | ${callData}`
      );

      await createCallChat({
        callerId,
        receiverId,
        callId,
        callType: type,
        callStatus: 1,
      });

      console.log(
        `CALL ACCEPTED | ${callId} | ${type} | BILLING STARTED`
      );
    } catch (error) {
      console.error(
        "callResponseHandled Error:",
        error
      );
    }
  });

  socket.on("callCancelled", async (data) => {
    try {
      const d = typeof data === "string" ? JSON.parse(data) : data;

      const {
        callerId,
        receiverId,
        callId,
        callType,
        callerRole,
        receiverRole,
      } = d || {};

      if (!callerId || !receiverId || !callId) {
        return;
      }

      // Stop billing if any billing timer exists
      clearCallBilling(callId);

      const callerType = String(callerRole || "")
        .trim()
        .toLowerCase();

      const receiverType = String(receiverRole || "")
        .trim()
        .toLowerCase();

      const type = String(callType || "")
        .trim()
        .toLowerCase();

      const CallerModel =
        callerType === "user" ? User : Host;

      const ReceiverModel =
        receiverType === "host" ? Host : User;

      const [caller, receiver, history] = await Promise.all([
        CallerModel.findById(callerId)
          .select("_id callId")
          .lean(),

        ReceiverModel.findById(receiverId)
          .select("_id callId")
          .lean(),

        History.findById(callId),
      ]);

      if (!caller || !receiver || !history) {
        return;
      }

      // Call already ended
      if (history.callEndTime) {
        return;
      }

      await Promise.all([
        CallerModel.updateOne(
          {
            _id: caller._id,
            callId,
          },
          {
            $set: {
              isBusy: false,
              callId: null,
            },
          }
        ),

        ReceiverModel.updateOne(
          {
            _id: receiver._id,
            callId,
          },
          {
            $set: {
              isBusy: false,
              callId: null,
            },
          }
        ),

        Privatecall.deleteOne({
          caller: caller._id,
          receiver: receiver._id,
        }),

        History.updateOne(
          {
            _id: callId,
          },
          {
            $set: {
              callConnect: false,
            },
          }
        ),
      ]);

      io.to(`globalRoom:${callerId}`).emit(
        "callFinished",
        d
      );

      io.to(`globalRoom:${receiverId}`).emit(
        "callFinished",
        d
      );

      await createCallChat({
        callerId,
        receiverId,
        callId,
        callType: type,
        callStatus: 3,
      });
    } catch (error) {
      console.error(
        "callCancelled Error:",
        error.message
      );
    }
  });


  socket.on("callDisconnected", async (data) => {
    const parseData = JSON.parse(data);
    const { callerId, receiverId, callId, callType, callMode, callerRole, receiverRole } = parseData;
    console.log("[callDisconnected]", "data in callDisconnected:", parseData);

    const validRoles = ["user", "host"];
    if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
      io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
      return;
    }

    const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
    const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

    const [caller, receiver, callHistory] = await Promise.all([
      callerModel.findById(callerId).select("_id name").lean(),
      receiverModel.findById(receiverId).select("_id name").lean(),
      History.findById(callId).select("_id callConnect callStartTime callEndTime duration userId hostId callType uniqueId isRandom isPrivate userCoin hostCoin date"),
    ]);

    if (!caller || !receiver || !callHistory) {
      console.error("❌ [callDisconnected] Invalid caller, receiver, or call history.");
      return io.to(`globalRoom:${callerId}`).emit("callTerminationFailed", { message: "Invalid call data." });
    }

    io.to(callId.toString()).emit("callDisconnected", data);
    io.socketsLeave(callId.toString());

    console.log(`✅ Caller: ${caller.name} | Receiver: ${receiver.name} | Call ID: ${callId}`);

    if (callMode.trim().toLowerCase() === "private") {
      const [callerUpdate, receiverUpdate, privateCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: callerId }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiverId }, { $set: { isBusy: false, callId: null } }),
        Privatecall.deleteOne({ caller: callerId, receiver: receiverId }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, privateCallDeleted);
    }

    if (callMode.trim().toLowerCase() === "random") {
      const [callerUpdate, receiverUpdate, randomCallDeleted] = await Promise.all([
        callerModel.updateOne({ _id: callerId }, { $set: { isBusy: false, callId: null } }),
        receiverModel.updateOne({ _id: receiverId }, { $set: { isBusy: false, callId: null } }),
        Randomcall.deleteOne({ caller: callerId }),
      ]);

      console.log(`🔹 Caller Status Updated:`, callerUpdate);
      console.log(`🔹 Receiver Status Updated:`, receiverUpdate);
      console.log(`🔹 Private Call Deleted:`, randomCallDeleted);
    }

    callHistory.callConnect = false;

    // MongoDB Date field ke liye actual current time
    const endTime = new Date();

    callHistory.callEndTime = endTime;

    // Duration calculate — timezone conversion bilkul nahi
    const startTime = new Date(callHistory.callStartTime);

    const durationMs = Math.max(0, endTime.getTime() - startTime.getTime());

    const totalSeconds = Math.floor(durationMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const duration =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

    callHistory.duration = duration;

    console.log("📞 CALL DURATION DEBUG");
    console.log("Start:", startTime.toISOString());
    console.log("End:", endTime.toISOString());
    console.log("Duration MS:", durationMs);
    console.log("Duration Seconds:", totalSeconds);
    console.log("Duration:", duration);

    await Promise.all([
      Chat.findOneAndUpdate(
        { callId: callHistory._id },
        {
          $set: {
            callDuration: duration,
            messageType: callType.trim().toLowerCase() === "audio" ? 5 : 6,
            message: callType.trim().toLowerCase() === "audio" ? "📞 Audio Call" : "📽 Video Call",
            callType: 1, // 1 = Received Call
            isRead: true,
          },
        },
        { new: true },
      ),
      callHistory.save(),
    ]);

    const userId = callHistory?.userId?.toString();
    const hostId = callHistory?.hostId?.toString();

    if (!userId || !hostId) return;

    const [hostData, userData] = await Promise.all([Host.findById(hostId).select("uniqueId name image country countryFlagImage").lean(), User.findById(userId).select("uniqueId name image").lean()]);

    const basePayload = {
      uniqueId: callHistory.uniqueId,
      callType: callHistory.callType,
      isPrivate: callHistory.isPrivate,
      isRandom: callHistory.isRandom,
      userCoin: callHistory.userCoin,
      hostCoin: callHistory.hostCoin,
      duration: callHistory.duration,
      date: moment(callHistory.date).tz("Asia/Kolkata").format("D MMM, HH:mm"),
    };

    const userPayload = {
      ...basePayload,
      host: {
        uniqueId: hostData?.uniqueId || "",
        name: hostData?.name || "",
        image: hostData?.image || "",
        country: hostData?.country || "",
        countryFlagImage: hostData?.countryFlagImage || "",
      },
    };

    const hostPayload = {
      ...basePayload,
      user: {
        uniqueId: userData?.uniqueId || "",
        name: userData?.name || "",
        image: userData?.image || "",
      },
    };

    if (callerRole === "user") {
      // user e call kari → banne ne mokalvu
      io.to("globalRoom:" + userId).emit("callEndedSummary", userPayload);
      io.to("globalRoom:" + hostId).emit("callEndedSummary", hostPayload);
    } else if (callerRole === "host") {
      // host e call kari → banne ne mokalvu
      io.to("globalRoom:" + userId).emit("callEndedSummary", userPayload);
      io.to("globalRoom:" + hostId).emit("callEndedSummary", hostPayload);
    }

    console.log("[callEndedSummary USER]", userPayload);
    console.log("[callEndedSummary HOST]", hostPayload);
  });


  socket.on("callCoinCharged", async (data) => {
    try {
      const parsedData =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      const {
        callerId,
        receiverId,
        callId,
        callMode,
        callType,
        gender,
      } = parsedData || {};

      if (!callerId || !receiverId || !callId) {
        return;
      }

      const mode = String(callMode || "")
        .trim()
        .toLowerCase();

      const type = String(callType || "")
        .trim()
        .toLowerCase();

      const [caller, receiver, history, vipPrivilege] =
        await Promise.all([
          User.findById(callerId)
            .select(
              "_id coin isVip vipPrivilege"
            )
            .lean(),

          Host.findById(receiverId)
            .select(
              "_id coin agencyId audioCallRate privateCallRate randomCallRate randomCallFemaleRate randomCallMaleRate"
            )
            .lean(),

          History.findById(callId)
            .select(
              "_id userId hostId callType callMode isPrivate isRandom callConnect"
            ),

          VipPlanPrivilege.findOne()
            .select(
              "audioCallDiscount privateCallDiscount randomMatchCallDiscount"
            )
            .lean(),
        ]);

      if (!caller || !receiver || !history) {
        return;
      }

      if (history.callConnect !== true) {
        return;
      }

      if (
        String(history.userId) !== String(caller._id) ||
        String(history.hostId) !== String(receiver._id)
      ) {
        return;
      }

      let charge = 0;
      let discount = 0;

      if (
        mode === "private" &&
        type === "audio"
      ) {
        charge = Math.abs(
          Number(receiver.audioCallRate || 0)
        );

        discount = Number(
          vipPrivilege?.audioCallDiscount || 0
        );
      }

      if (
        mode === "private" &&
        type === "video"
      ) {
        charge = Math.abs(
          Number(receiver.privateCallRate || 0)
        );

        discount = Number(
          vipPrivilege?.privateCallDiscount || 0
        );
      }

      if (
        mode === "random" &&
        type === "video"
      ) {
        const userGender = String(gender || "")
          .trim()
          .toLowerCase();

        if (userGender === "female") {
          charge = Math.abs(
            Number(
              receiver.randomCallFemaleRate || 0
            )
          );
        } else if (userGender === "male") {
          charge = Math.abs(
            Number(
              receiver.randomCallMaleRate || 0
            )
          );
        } else {
          charge = Math.abs(
            Number(
              receiver.randomCallRate || 0
            )
          );
        }

        discount = Number(
          vipPrivilege?.randomMatchCallDiscount || 0
        );
      }

      if (charge <= 0) {
        return;
      }

      const originalCharge = charge;

      if (
        caller.isVip &&
        caller.vipPrivilege
      ) {
        discount = Math.min(
          Math.max(discount, 0),
          100
        );

        charge = Number(
          (
            charge -
            (charge * discount) / 100
          ).toFixed(2)
        );
      }

      if (charge <= 0) {
        return;
      }

      const vipDiscountCoins = Number(
        (
          originalCharge -
          charge
        ).toFixed(2)
      );

      const adminRate = Number(
        settingJSON?.adminCommissionRate || 0
      );

      const adminCoins = Number(
        (
          (charge * adminRate) /
          100
        ).toFixed(2)
      );

      const hostGross = Number(
        (
          charge -
          adminCoins
        ).toFixed(2)
      );

      let agencyCoins = 0;
      let agencyRate = 0;
      let agency = null;

      if (receiver.agencyId) {
        agency = await Agency.findById(
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
          agencyRate = Number(
            agency.commission || 0
          );

          agencyCoins = Number(
            (
              (hostGross * agencyRate) /
              100
            ).toFixed(2)
          );
        }
      }

      const hostCoins = Number(
        (
          hostGross -
          agencyCoins
        ).toFixed(2)
      );

      // console.log(
      //   "\n========== CALL BILLING BREAKDOWN ==========",
      //   `\nCall ID             : ${callId}`,
      //   `\nCall Mode           : ${mode}`,
      //   `\nCall Type           : ${type}`,
      //   `\nUser ID             : ${caller._id}`,
      //   `\nHost ID             : ${receiver._id}`,
      //   `\nOriginal Rate       : ${originalCharge}`,
      //   `\nVIP Discount        : ${discount}%`,
      //   `\nVIP Discount Coins  : ${vipDiscountCoins}`,
      //   `\nUser Final Charge   : ${charge}`,
      //   `\nAdmin Rate          : ${adminRate}%`,
      //   `\nAdmin Coins         : ${adminCoins}`,
      //   `\nHost Gross          : ${hostGross}`,
      //   `\nAgency ID           : ${agency?._id || "NONE"}`,
      //   `\nAgency Rate         : ${agencyRate}%`,
      //   `\nAgency Coins        : ${agencyCoins}`,
      //   `\nFinal Host Coins    : ${hostCoins}`,
      //   `\n============================================\n`
      // );

      const userUpdate = await User.updateOne(
        {
          _id: caller._id,
          coin: {
            $gte: charge,
          },
        },
        {
          $inc: {
            coin: -charge,
            spentCoins: charge,
          },
        }
      );

      if (userUpdate.modifiedCount !== 1) {
        io.to(
          `globalRoom:${caller._id}`
        ).emit(
          "insufficientCoins",
          "You don't have sufficient coins."
        );

        console.log(
          `CALL BILLING | INSUFFICIENT COINS | User: ${caller._id} | Required: ${charge}`
        );

        return;
      }

      const updates = [
        Host.updateOne(
          {
            _id: receiver._id,
          },
          {
            $inc: {
              coin: hostCoins,
            },
          }
        ),

        History.updateOne(
          {
            _id: history._id,
            callConnect: true,
          },
          {
            $inc: {
              userCoin: charge,
              hostCoin: hostCoins,
              adminCoin: adminCoins,
              agencyCoin: agencyCoins,
            },
          }
        ),
      ];

      if (
        agency &&
        agencyCoins > 0
      ) {
        updates.push(
          Agency.updateOne(
            {
              _id: agency._id,
            },
            {
              $inc: {
                hostCoins: hostGross,
                totalEarnings: agencyCoins,
                netAvailableEarnings: agencyCoins,
                totalEarningsWithCommissionAndHostCoin:
                  hostGross + agencyCoins,
              },
            }
          )
        );
      }

      await Promise.all(updates);

      await emitHostStatusUpdate(
        io,
        receiver._id
      );

      // console.log(
      //   "\n========== CALL BILLING SUCCESS ==========",
      //   `\nUser Coin Deducted : -${charge}`,
      //   `\nAdmin Earned       : +${adminCoins}`,
      //   `\nAgency Earned      : +${agencyCoins}`,
      //   `\nHost Earned        : +${hostCoins}`,
      //   `\n==========================================\n`
      // );

      const billingData = {
        callId: String(callId),
        callType: type,
        callMode: mode,
        userCoins: charge,
        originalRate: originalCharge,
        vipDiscount: discount,
        vipDiscountCoins,
        adminCoins,
        adminRate,
        hostGross,
        hostCoins,
        agencyCoins,
        agencyRate,
      };

      io.to(
        `globalRoom:${caller._id}`
      ).emit(
        "callBillingUpdated",
        billingData
      );

      io.to(
        `globalRoom:${receiver._id}`
      ).emit(
        "callBillingUpdated",
        billingData
      );
    } catch (error) {
      console.error(
        "callCoinCharged Error:",
        error.message
      );
    }
  });

  socket.on("callCoinChargedForFakeCall", async (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("[callCoinChargedForFakeCall] Parsed Data:", parsedData);

      const { callerId, receiverId, callMode, callType, gender } = parsedData;

      const [callUniqueId, caller, receiver, vipPrivilege] = await Promise.all([
        generateHistoryUniqueId(),
        User.findById(callerId).select("_id coin isVip").lean(),
        Host.findById(receiverId).select("_id coin privateCallRate audioCallRate randomCallRate randomCallFemaleRate randomCallMaleRate agencyId").lean(),
        VipPlanPrivilege.findOne().select("audioCallDiscount privateCallDiscount randomMatchCallDiscount").lean(),
      ]);

      if (!caller || !receiver) {
        console.log("[callCoinChargedForFakeCall] Caller or Receiver not found!");
        return;
      }

      const normalizedCallType = callType?.trim()?.toLowerCase();
      const normalizedCallMode = callMode?.trim()?.toLowerCase();

      let historyDoc = await History.findOne({
        userId: caller._id,
        hostId: receiver._id,
        callType: normalizedCallMode,
        isPrivate: normalizedCallMode === "private",
        isRandom: normalizedCallMode === "random",
        type: normalizedCallType === "audio" ? 11 : 12,
      });

      if (!historyDoc) {
        historyDoc = await History.create({
          uniqueId: callUniqueId,
          type: normalizedCallType === "audio" ? 11 : 12,
          userId: caller._id,
          hostId: receiver._id,
          isPrivate: normalizedCallMode === "private",
          isRandom: normalizedCallMode === "random",
          callType: normalizedCallMode,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });
      }

      const historyId = historyDoc._id;
      const settingJSON = global.settings || { adminCommissionRate: 20 };
      const adminCommissionRate = settingJSON.adminCommissionRate || 20;

      const processCallPayment = async (callCharge, discountPercent = 0) => {
        const discountAmount = Math.floor((callCharge * discountPercent) / 100);
        callCharge -= discountAmount;

        let adminShare = 0;
        let hostEarnings = 0;
        let agencyShare = 0;

        adminShare = Math.floor((callCharge * adminCommissionRate) / 100);
        hostEarnings = callCharge - adminShare;

        adminShare = Number(adminShare.toFixed(2));
        hostEarnings = Number(hostEarnings.toFixed(2));

        let agencyUpdate = null;

        if (receiver.agencyId) {
          const agency = await Agency.findById(receiver.agencyId).lean().select("_id commissionType commission");

          if (agency) {
            if (agency.commissionType === 1) {
              agencyShare = (hostEarnings * agency.commission) / 100;
            }

            agencyShare = Number(agencyShare.toFixed(2));

            agencyUpdate = Agency.updateOne(
              { _id: agency._id },
              {
                $inc: {
                  hostCoins: hostEarnings,
                  totalEarnings: agencyShare,
                  netAvailableEarnings: hostEarnings + agencyShare,
                  totalEarningsWithCommissionAndHostCoin: hostEarnings + agencyShare,
                },
              },
            );
          }
        }

        if (caller.coin >= callCharge) {
          await Promise.all([
            User.updateOne(
              { _id: caller._id, coin: { $gte: callCharge } },
              {
                $inc: {
                  coin: -callCharge,
                  spentCoins: callCharge,
                },
              },
            ),
            Host.updateOne({ _id: receiver._id }, { $inc: { coin: hostEarnings } }),
            History.updateOne(
              { _id: historyId },
              {
                $set: {
                  agencyId: receiver.agencyId || null,
                  date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
                },
                $inc: {
                  userCoin: callCharge,
                  hostCoin: hostEarnings,
                  adminCoin: adminShare,
                  agencyCoin: agencyShare,
                },
              },
            ),
            agencyUpdate,
          ]);

          console.log("[callCoinChargedForFakeCall] Coin deduction and history update successful.");
        } else {
          console.log(`[callCoinChargedForFakeCall] Insufficient Coins for Caller: ${caller._id}`);
          io.in("globalRoom:" + caller._id.toString()).emit("insufficientCoins", "You don't have sufficient coins.");
        }
      };

      if (normalizedCallMode === "private" && normalizedCallType === "audio") {
        const rate = Math.abs(receiver.audioCallRate);
        const discount = caller.isVip && vipPrivilege?.audioCallDiscount ? Math.min(Math.max(vipPrivilege.audioCallDiscount, 0), 100) : 0;
        await processCallPayment(rate, discount);
      }

      if (normalizedCallMode === "private" && normalizedCallType === "video") {
        const rate = Math.abs(receiver.privateCallRate);
        const discount = caller.isVip && vipPrivilege?.privateCallDiscount ? Math.min(Math.max(vipPrivilege.privateCallDiscount, 0), 100) : 0;
        await processCallPayment(rate, discount);
      }

      if (normalizedCallMode === "random" && normalizedCallType === "video") {
        let rate = Math.abs(receiver.randomCallRate) || 100;
        if (gender?.toLowerCase() === "female") {
          rate = Math.abs(receiver.randomCallFemaleRate);
        } else if (gender?.toLowerCase() === "male") {
          rate = Math.abs(receiver.randomCallMaleRate);
        }

        const discount = caller.isVip && vipPrivilege?.randomMatchCallDiscount ? Math.min(Math.max(vipPrivilege.randomMatchCallDiscount, 0), 100) : 0;

        await processCallPayment(rate, discount);
      }
    } catch (error) {
      console.error("[callCoinChargedForFakeCall] Error:", error);
    }
  });


  //random video call
  socket.on("ringingStarted", async (data) => {
    const parsedData = JSON.parse(data);
    const { callerId, receiverId, agoraUID, channel, gender, callerRole, receiverRole } = parsedData;
    console.log("ringingStarted request received:", parsedData);

    const validRoles = ["user", "host"];
    if (!validRoles.includes(callerRole?.toLowerCase()) || !validRoles.includes(receiverRole?.toLowerCase())) {
      io.in("globalRoom:" + callerId.toString()).emit("callRinging", { message: "Invalid roles provided." });
      return;
    }

    const callerModel = callerRole.trim().toLowerCase() === "user" ? User : Host;
    const receiverModel = receiverRole.trim().toLowerCase() === "host" ? Host : User;

    const role = RtcRole.PUBLISHER;
    const uid = agoraUID ? agoraUID : 0;
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const [callUniqueId, token, caller, receiver] = await Promise.all([
      generateHistoryUniqueId(),
      RtcTokenBuilder.buildTokenWithUid(settingJSON?.agoraAppId, settingJSON?.agoraAppCertificate, channel, uid, role, privilegeExpiredTs),
      callerModel.findById(callerId).select("_id name image isBlock isBusy callId isOnline uniqueId").lean(),
      receiverModel.findById(receiverId).select("_id name image isBlock isBusy callId isOnline uniqueId fcmToken").lean(),
    ]);

    if (!caller) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", { message: "Caller does not found." });
      return;
    }

    if (caller.isBlock) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Caller is blocked.",
        isBlock: true,
      });
      return;
    }

    if (caller.isBusy && caller.callId) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Caller is busy with someone else.",
        isBusy: true,
      });
      return;
    }

    if (!receiver) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", { message: "Receiver does not found." });
      return;
    }

    if (receiver.isBlock) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is blocked.",
        isBlock: true,
      });
      return;
    }

    if (!receiver.isOnline) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is not online.",
        isOnline: false,
      });
      return;
    }

    if (receiver.isBusy && receiver.callId) {
      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is busy with another call.",
        isBusy: true,
      });
      return;
    }

    if (!receiver.isBusy && receiver.callId === null) {
      console.log("Receiver and Caller are free. Proceeding with call setup.");

      const callHistory = new History();
      callHistory.uniqueId = callUniqueId;
      callHistory.callId = callUniqueId;

      const callerVerify = await callerModel.updateOne(
        {
          _id: caller._id
        },
        {
          $set: {
            isBusy: true,
            callId: callHistory._id
          }
        }
      );

      const receiverVerify = await
        receiverModel.updateOne(
          {
            _id: receiver._id
          },
          {
            $set: {
              isBusy: true,
              callId: callHistory._id
            }
          }

        );

      if (callerVerify.modifiedCount > 0 && receiverVerify.modifiedCount > 0) {
        const dataOfVideoCall = {
          callerId: caller._id,
          receiverId: receiver._id,
          callerImage: caller.image,
          callerName: caller.name,
          callerUniqueId: caller.uniqueId,
          receiverName: receiver.name,
          receiverImage: receiver.image,
          receiverUniqueId: receiver.uniqueId,
          callId: callHistory._id,
          callType: "video",
          callMode: "random",
          token,
          channel,
          callerRole,
          receiverRole,
          gender: gender.trim().toLowerCase(),
        };

        io.in("globalRoom:" + receiver._id.toString()).emit("callIncoming", dataOfVideoCall); // Notify receiver
        io.in("globalRoom:" + caller._id.toString()).emit("callConnected", dataOfVideoCall); // Notify caller

        console.log(`Call successfully initiated: ${caller.name} → ${receiver.name}`);

        if (!receiver.isBlock && receiver.fcmToken !== null) {
          const isVideo = dataOfVideoCall.callType?.trim().toLowerCase() === "video";
          const isRandom = dataOfVideoCall.callMode === "random";
          const callerName = dataOfVideoCall.callerName?.trim() || "Someone";

          const notificationTitle = isVideo ? (isRandom ? "🎥 Incoming Random Video Call!" : "🎥 Incoming Video Call") : isRandom ? "📞 Incoming Random Audio Call!" : "📞 Incoming Audio Call";

          const notificationBody = isVideo
            ? isRandom
              ? `${callerName} wants to randomly video chat with you! Tap to join 🔗`
              : `${callerName} is inviting you to a video call. Tap to connect now! 👥`
            : isRandom
              ? `${callerName} wants a random audio chat! Tap to talk 🎙️`
              : `${callerName} is calling you for an audio chat. Tap to join the conversation! 📞`;

          const payload = {
            token: receiver.fcmToken,
            data: {
              title: notificationTitle,
              body: notificationBody,
              type: "callIncoming",
              callType: dataOfVideoCall.callType,
              callId: dataOfVideoCall.callId.toString(),
              callerId: dataOfVideoCall.callerId.toString(),
              receiverId: dataOfVideoCall.receiverId.toString(),
              callerName: dataOfVideoCall.callerName,
              callerImage: dataOfVideoCall.callerImage,
              senderImage: dataOfVideoCall.callerImage,
              callerUniqueId: dataOfVideoCall.callerUniqueId,
              receiverName: dataOfVideoCall.receiverName,
              receiverImage: dataOfVideoCall.receiverImage,
              receiverUniqueId: dataOfVideoCall.receiverUniqueId,
              token: dataOfVideoCall.token,
              channel: dataOfVideoCall.channel,
              callMode: dataOfVideoCall.callMode,
              gender: dataOfVideoCall.gender,
            },
          };


          admin.messaging
            .send(payload)
            .then((response) => {
              console.log("📨 Call notification sent successfully:", response);
            })
            .catch((error) => {
              console.error("⚠️ Failed to send call notification:", error);
            });
        }

        callHistory.type = 13;
        callHistory.callType = "video";
        callHistory.isRandom = true;
        callHistory.userId = caller._id;
        callHistory.hostId = receiver._id;
        callHistory.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        await Promise.all([
          callHistory.save(),
          Randomcall({
            caller: caller._id,
          }).save(),
        ]);
      } else {
        console.log("Failed to verify caller or receiver availability");

        io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
          message: "Call setup failed. One or both users became unavailable.",
          isBusy: true,
        });

        if (callerVerify.modifiedCount > 0) {
          await callerModel.updateOne({ _id: callerId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Caller Status Updated: Caller verification failed, isBusy reset`);
        }

        if (receiverVerify.modifiedCount > 0) {
          await receiverModel.updateOne({ _id: receiverId, isBusy: true }, { $set: { isBusy: false, callId: null } });
          console.log(`🔹 Receiver Status Updated: Receiver verification failed, isBusy reset`);
        }
        return;
      }
    } else {
      console.log("Condition not met - receiver not available");

      io.in("globalRoom:" + caller._id.toString()).emit("ringingStarted", {
        message: "Receiver is unavailable for a call at this moment.",
        isBusy: true,
      });
      return;
    }
  });

  // LIVE STREAMING handlers (liveSync, comments, audience, gifts, heartbeat, end) are registered for EVERY
  // socket (host or viewer) at the top of this handler: see registerLiveSocketHandlers().

  socket.on("subscribeHostList", async (data) => {
    try {
      console.log("🔥 HOST LIST SUBSCRIBE REQUEST =>", data);

      const parsedData =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      let country = String(
        parsedData?.country || "global"
      )
        .trim()
        .toLowerCase();

      if (
        !country ||
        country === "world wide" ||
        country === "worldwide"
      ) {
        country = "global";
      }

      const roomName = `hostList:${country}`;

      socket.join(roomName);

      console.log("🔥 HOST LIST SUBSCRIBED =>", {
        socketId: socket.id,
        country,
        roomName,
      });

      const sockets = await io
        .in(roomName)
        .fetchSockets();

      console.log("🔥 HOST LIST ROOM SOCKET COUNT =>", {
        roomName,
        count: sockets.length,
        socketIds: sockets.map((s) => s.id),
      });
    } catch (error) {
      console.error("subscribeHostList Error:", error);
    }
  });

  // ===============================================
  // AUDIO ROOM SOCKET MODULE
  // ===============================================

  const emitViewerCount = async (io, roomId) => {

    const count = await Participant.countDocuments({
      roomId,
      isActive: true,
    });

    io.to(`room:${roomId}`).emit(
      "room:viewer-count",
      {
        roomId,
        count,
      },
    );
  };

  const emitSpeakersUpdated = async (
    io,
    roomId,
  ) => {

    io.to(`room:${roomId}`).emit(
      "room:speakers-updated",
      {
        roomId,
      },
    );
  };

  // START ROOM + AGORA TOKEN
  socket.on(
    "room:start",
    async ({ roomId }) => {
      try {
        const userId = socket.data.userId;
        const hostId = socket.data.hostId;
        const isHost = socket.data.isHost === true;

        console.log("🔥 ROOM START REQUEST =>", {
          roomId,
          userId,
          hostId,
          isHost,
          socketId: socket.id,
        });

        if (!roomId || !userId) {
          return socket.emit("room:error", {
            message: "Invalid room request",
          });
        }

        if (!isHost || !hostId) {
          return socket.emit("room:error", {
            message: "Only host can start the room",
          });
        }

        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit("room:error", {
            message: "Room not found",
          });
        }

        if (
          !room.hostId ||
          room.hostId.toString() !== hostId.toString()
        ) {
          return socket.emit("room:error", {
            message: "You are not the owner of this room",
          });
        }

        if (room.status === "live") {
          return socket.emit("room:error", {
            message: "Room already live",
          });
        }

        const host = await Participant.findOne({
          roomId,
          userId,
        });

        if (!host) {
          return socket.emit("room:error", {
            message: "Host participant not found",
          });
        }

        if (!host.agoraUid) {
          return socket.emit("room:error", {
            message: "Host Agora UID not found",
          });
        }

        const socketRoom = `room:${roomId}`;

        if (room.status === "ended") {
          console.log(
            "🔄 RESTARTING ENDED ROOM =>",
            roomId,
          );

          await Participant.updateMany(
            {
              roomId,
              userId: {
                $ne: userId,
              },
            },
            {
              $set: {
                isActive: false,
                socketId: null,
                leftAt: new Date(),
                role: "audience",
                seatIndex: null,
                isMuted: false,
                isHandRaised: false,
                requestedSeatIndex: null,
                micEnabled: false,
              },
            },
          );

          console.log(
            "OLD ROOM PARTICIPANTS RESET =>",
            roomId,
          );
        }

        room.status = "live";
        room.startedAt = new Date();
        room.endedAt = null;

        await room.save();

        host.isActive = true;
        host.socketId = socket.id;
        host.leftAt = null;
        host.role = "host";
        host.seatIndex = 0;
        host.isHandRaised = false;
        host.requestedSeatIndex = null;
        host.isMuted = false;

        if (host.micEnabled !== undefined) {
          host.micEnabled = true;
        }

        await host.save();

        socket.join(socketRoom);

        console.log(
          "✅ HOST JOINED SOCKET ROOM =>",
          socketRoom,
        );

        const sockets = await io
          .in(socketRoom)
          .fetchSockets();

        console.log(
          "ROOM SOCKET COUNT =>",
          sockets.length,
        );

        console.log(
          "ROOM SOCKET IDS =>",
          sockets.map(
            (item) => item.id,
          ),
        );

        const token = buildToken({
          channel: roomId,
          uid: host.agoraUid,
          role: "publisher",
        });

        socket.emit(
          "room:token",
          {
            token,
            uid: host.agoraUid,
            channelName: roomId,
            role: "host",
            seatIndex: 0,
          },
        );

        socket.emit(
          "room:started",
          {
            roomId,
            hostId: hostId,
            restarted: room.status === "live",
          },
        );

        io.to(socketRoom).emit(
          "room:user-joined",
          {
            roomId,
            userId,
          },
        );

        io.to(socketRoom).emit(
          "room:user-updated",
          {
            roomId,
            userId,
          },
        );

        await emitViewerCount(
          io,
          roomId,
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );

        console.log(
          "🔥 ROOM STARTED SUCCESSFULLY =>",
          {
            roomId,
            hostId,
            userId,
            socketId: socket.id,
            agoraUid: host.agoraUid,
          },
        );
      } catch (err) {
        console.log(
          "❌ ROOM START ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message: err.message,
          },
        );
      }
    },
  );

  // ROOM JOIN SOCKET
  socket.on(
    "room:join",
    async (data) => {
      console.log("🔥🔥🔥 ROOM JOIN EVENT 🔥🔥🔥");
      console.log("SOCKET ID =>", socket.id);
      console.log("USER ID =>", socket.data.userId);

      try {
        const roomId = data?.roomId;
        const userId = socket.data.userId;

        console.log("ROOM JOIN REQUEST =>", {
          roomId,
          userId,
          socketId: socket.id,
        });

        if (!roomId || !userId) {
          return socket.emit("room:error", {
            message: "Invalid room request",
          });
        }

        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit("room:error", {
            message: "Room not found",
          });
        }

        if (room.status !== "live") {
          return socket.emit("room:error", {
            message: "Room is not live",
          });
        }

        const participant = await Participant.findOne({
          roomId,
          userId,
        });

        if (!participant) {
          return socket.emit("room:error", {
            message: "You are not a participant of this room",
          });
        }

        const socketRoom = `room:${roomId}`;

        socket.join(socketRoom);

        console.log(
          "✅ USER JOINED AUDIO ROOM =>",
          socketRoom,
        );

        participant.isActive = true;
        participant.socketId = socket.id;
        participant.leftAt = null;

        await participant.save();

        const sockets = await io
          .in(socketRoom)
          .fetchSockets();

        console.log(
          "ROOM SOCKET COUNT =>",
          sockets.length,
        );

        console.log(
          "ROOM SOCKET IDS =>",
          sockets.map((item) => item.id),
        );

        io.to(socketRoom).emit(
          "room:user-joined",
          {
            roomId,
            userId,
          },
        );

        io.to(socketRoom).emit(
          "room:user-updated",
          {
            roomId,
            userId,
          },
        );

        await emitViewerCount(
          io,
          roomId,
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );

        socket.emit(
          "room:joined",
          {
            roomId,
            userId,
            role: participant.role,
            seatIndex: participant.seatIndex,
            isMuted: participant.isMuted,
            isHandRaised: participant.isHandRaised,
            requestedSeatIndex:
              participant.requestedSeatIndex,
          },
        );

        console.log(
          "🔥 ROOM JOIN SUCCESS =>",
          {
            roomId,
            userId,
            role: participant.role,
            seatIndex: participant.seatIndex,
          },
        );
      } catch (err) {
        console.log(
          "❌ ROOM JOIN ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message: err.message,
          },
        );
      }
    },
  );
  // LEAVE ROOM
  socket.on(
    "room:leave",
    async ({ roomId }) => {
      try {
        const userId = socket.data.userId;

        console.log("ROOM LEAVE REQUEST =>", {
          roomId,
          userId,
          socketId: socket.id,
        });

        if (!roomId || !userId) {
          return socket.emit("room:error", {
            message: "Invalid room leave request",
          });
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit("room:error", {
            message: "Active participant not found",
          });
        }

        participant.isActive = false;
        participant.leftAt = new Date();
        participant.socketId = null;
        participant.isHandRaised = false;
        participant.requestedSeatIndex = null;
        participant.isMuted = false;
        participant.role = "audience";
        participant.seatIndex = null;

        if (participant.micEnabled !== undefined) {
          participant.micEnabled = false;
        }

        await participant.save();

        const socketRoom = `room:${roomId}`;

        socket.leave(socketRoom);

        io.to(socketRoom).emit(
          "room:user-left",
          {
            roomId,
            userId,
          },
        );

        io.to(socketRoom).emit(
          "room:user-updated",
          {
            roomId,
            userId,
          },
        );

        io.to(socketRoom).emit(
          "room:speakers-updated",
          {
            roomId,
          },
        );

        await emitViewerCount(
          io,
          roomId,
        );

        console.log(
          "ROOM LEAVE SUCCESS =>",
          {
            roomId,
            userId,
            socketId: socket.id,
          },
        );
      } catch (err) {
        console.log(
          "ROOM LEAVE ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message: err.message,
          },
        );
      }
    },
  );
  // SEAT REQUEST (RAISE HAND)
  socket.on("room:seat-request", async (data) => {
    console.log("🔥🔥🔥 ACTUAL SEAT REQUEST HANDLER 🔥🔥🔥");
    console.log("SOCKET ID =>", socket.id);
    console.log("SOCKET USER =>", socket.data.userId);
    console.log("DATA =>", data);

    try {
      const roomId = data?.roomId;
      const seatIndex = Number(data?.seatIndex);
      const userId = socket.data.userId;

      console.log("ROOM ID =>", roomId);
      console.log("USER ID =>", userId);
      console.log("SEAT INDEX =>", seatIndex);

      if (!roomId || !userId) {
        console.log("❌ INVALID ROOM OR USER");

        return socket.emit("room:error", {
          message: "Invalid room request",
        });
      }

      if (!Number.isInteger(seatIndex) || seatIndex <= 0) {
        console.log("❌ INVALID SEAT INDEX");

        return socket.emit("room:error", {
          message: "Invalid seat index",
        });
      }

      const participant = await Participant.findOne({
        roomId,
        userId,
        isActive: true,
      }).populate("userId");

      console.log(
        "PARTICIPANT FOUND =>",
        !!participant,
      );

      if (!participant) {
        console.log("❌ PARTICIPANT NOT FOUND");

        return socket.emit("room:error", {
          message: "Participant not found in room",
        });
      }

      console.log("PARTICIPANT ROLE =>", participant.role);
      console.log(
        "CURRENT HAND =>",
        participant.isHandRaised,
      );
      console.log(
        "CURRENT REQUESTED SEAT =>",
        participant.requestedSeatIndex,
      );

      if (
        participant.role === "host" ||
        participant.role === "speaker"
      ) {
        return socket.emit("room:error", {
          message: "You cannot request a speaker seat",
        });
      }

      participant.isHandRaised = true;
      participant.requestedSeatIndex = seatIndex;

      await participant.save();

      console.log("✅ PARTICIPANT SAVED");

      const payload = {
        roomId,
        request: {
          seatIndex,
          type: "requested",
          role: participant.role,
          isMuted: participant.isMuted,
          isHandRaised: true,
          requestedSeatIndex: seatIndex,
          user: {
            _id: participant.userId._id,
            name: participant.userId.name,
            image: participant.userId.image,
            country: participant.userId.country,
            countryFlagImage:
              participant.userId.countryFlagImage,
            uniqueId: participant.userId.uniqueId,
            coin: participant.userId.coin,
            isVip: participant.userId.isVip,
          },
        },
      };

      console.log("📢 BROADCASTING TO =>", `room:${roomId}`);
      console.log("📢 PAYLOAD =>", payload);

      io.to(`room:${roomId}`).emit(
        "room:seat-request",
        payload,
      );

      console.log("✅ BROADCAST COMPLETE");

      await emitSpeakersUpdated(io, roomId);

      console.log("🔥🔥🔥 SEAT REQUEST COMPLETE 🔥🔥🔥");
    } catch (error) {
      console.log("❌ SEAT REQUEST ERROR =>", error);

      socket.emit("room:error", {
        message: error.message,
      });
    }
  });
  socket.on(
    "room:seat-request-cancel",
    async ({ roomId }) => {


      try {
        const userId = socket.data.userId;

        const participant =
          await Participant.findOne({
            roomId,
            userId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit("room:error", {
            message: "Participant not found",
          });
        }

        participant.isHandRaised = false;
        participant.requestedSeatIndex = null;

        await participant.save();

        io.to(`room:${roomId}`).emit(
          "room:seat-request-cancelled",
          {
            roomId,
            userId,
          },
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );
      } catch (err) {
        socket.emit("room:error", {
          message: err.message,
        });
      }
    },
  );
  // SEAT APPROVE (HOST)
  socket.on(
    "room:seat-approve",
    async ({
      roomId,
      targetUserId,
    }) => {
      try {
        const hostId = socket.data.userId;

        console.log(
          "SEAT APPROVE REQUEST =>",
          {
            roomId,
            hostId,
            targetUserId,
          },
        );

        if (
          !roomId ||
          !hostId ||
          !targetUserId
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Invalid seat approval request",
            },
          );
        }

        const host =
          await Participant.findOne({
            roomId,
            userId: hostId,
            isActive: true,
            role: "host",
          });

        if (!host) {
          return socket.emit(
            "room:error",
            {
              message:
                "Only host can approve seat",
            },
          );
        }

        const room =
          await Room.findById(
            roomId,
          );

        if (!room) {
          return socket.emit(
            "room:error",
            {
              message:
                "Room not found",
            },
          );
        }

        if (
          room.status !== "live"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Room is not live",
            },
          );
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId: targetUserId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit(
            "room:error",
            {
              message:
                "User not found in room",
            },
          );
        }

        if (
          participant.role ===
          "host"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Host cannot be approved as speaker",
            },
          );
        }

        if (
          participant.role ===
          "speaker"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "User already speaker",
            },
          );
        }

        if (
          !participant.isHandRaised
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "User has no pending seat request",
            },
          );
        }

        if (
          !participant.agoraUid
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "User Agora UID not found",
            },
          );
        }

        const speakerCount =
          await Participant.countDocuments({
            roomId,
            role: {
              $in: [
                "host",
                "speaker",
              ],
            },
            isActive: true,
          });

        if (
          speakerCount >=
          room.seatLimit
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Seats full",
            },
          );
        }

        const occupiedSeats =
          await Participant.find({
            roomId,
            isActive: true,
            seatIndex: {
              $ne: null,
            },
          }).select(
            "seatIndex",
          );

        const usedSeats =
          new Set(
            occupiedSeats.map(
              (item) =>
                Number(
                  item.seatIndex,
                ),
            ),
          );

        let availableSeat = null;

        for (
          let i = 1;
          i <= room.seatLimit;
          i++
        ) {
          if (
            !usedSeats.has(i)
          ) {
            availableSeat = i;
            break;
          }
        }

        if (
          availableSeat ===
          null
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "No seat available",
            },
          );
        }

        participant.role =
          "speaker";

        participant.seatIndex =
          availableSeat;

        participant.isMuted =
          false;

        participant.isHandRaised =
          false;

        participant.requestedSeatIndex =
          null;

        if (
          participant.micEnabled !==
          undefined
        ) {
          participant.micEnabled =
            true;
        }

        await participant.save();

        const token =
          buildToken({
            channel:
              roomId,
            uid:
              participant.agoraUid,
            role:
              "publisher",
          });

        const socketRoom =
          `room:${roomId}`;

        io.to(
          socketRoom,
        ).emit(
          "room:seat-approved",
          {
            roomId,
            userId:
              targetUserId,
            role:
              "speaker",
            seatIndex:
              availableSeat,
          },
        );

        io.to(
          socketRoom,
        ).emit(
          "room:user-updated",
          {
            roomId,
            userId:
              targetUserId,
          },
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );

        socket.emit(
          "room:message",
          {
            type:
              "seat_approved",
            message:
              "Speaker approved successfully",
          },
        );

        if (
          participant.socketId
        ) {
          io.to(
            participant.socketId,
          ).emit(
            "room:message",
            {
              type:
                "seat_approved",
              message:
                "Your request has been approved. You are now a speaker.",
            },
          );

          io.to(
            participant.socketId,
          ).emit(
            "room:token",
            {
              token,
              uid:
                participant.agoraUid,
              channelName:
                roomId,
              role:
                "speaker",
              seatIndex:
                availableSeat,
            },
          );
        }

        await emitViewerCount(
          io,
          roomId,
        );

        console.log(
          "SEAT APPROVED =>",
          {
            roomId,
            hostId,
            targetUserId,
            seatIndex:
              availableSeat,
          },
        );
      } catch (err) {
        console.log(
          "SEAT APPROVE SOCKET ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message:
              err.message,
          },
        );
      }
    },
  );

  // LEAVE SEAT
  socket.on(
    "room:seat-leave",
    async ({ roomId }) => {
      try {
        const userId = socket.data.userId;

        console.log(
          "SEAT LEAVE REQUEST =>",
          {
            roomId,
            userId,
          },
        );

        if (!roomId || !userId) {
          return socket.emit(
            "room:error",
            {
              message:
                "Invalid seat leave request",
            },
          );
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit(
            "room:error",
            {
              message:
                "Active participant not found",
            },
          );
        }

        if (
          participant.role !==
          "speaker"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "User is not currently on a speaker seat",
            },
          );
        }

        const previousSeatIndex =
          participant.seatIndex;

        participant.role =
          "audience";

        participant.seatIndex =
          null;

        participant.isMuted =
          false;

        participant.isHandRaised =
          false;

        participant.requestedSeatIndex =
          null;

        if (
          participant.micEnabled !==
          undefined
        ) {
          participant.micEnabled =
            false;
        }

        await participant.save();

        const token =
          buildToken({
            channel:
              roomId,
            uid:
              participant.agoraUid,
            role:
              "subscriber",
          });

        const socketRoom =
          `room:${roomId}`;

        io.to(
          socketRoom,
        ).emit(
          "room:seat-left",
          {
            roomId,
            userId,
            seatIndex:
              previousSeatIndex,
          },
        );

        io.to(
          socketRoom,
        ).emit(
          "room:user-updated",
          {
            roomId,
            userId,
          },
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );

        await emitViewerCount(
          io,
          roomId,
        );

        socket.emit(
          "room:token",
          {
            token,
            uid:
              participant.agoraUid,
            channelName:
              roomId,
            role:
              "audience",
            seatIndex:
              null,
          },
        );

        console.log(
          "SEAT LEFT =>",
          {
            roomId,
            userId,
            previousSeatIndex,
          },
        );
      } catch (err) {
        console.log(
          "LEAVE SEAT SOCKET ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message:
              err.message,
          },
        );
      }
    },
  );
  // VIEWER COUNT
  socket.on(
    "room:viewer-count",
    async ({ roomId }) => {
      try {
        const userId = socket.data.userId;

        if (!roomId || !userId) {
          return socket.emit(
            "room:error",
            {
              message:
                "Invalid viewer count request",
            },
          );
        }

        const room =
          await Room.findById(
            roomId,
          );

        if (!room) {
          return socket.emit(
            "room:error",
            {
              message:
                "Room not found",
            },
          );
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit(
            "room:error",
            {
              message:
                "User is not active in this room",
            },
          );
        }

        await emitViewerCount(
          io,
          roomId,
        );

        console.log(
          "VIEWER COUNT UPDATED =>",
          {
            roomId,
            userId,
          },
        );
      } catch (err) {
        console.log(
          "VIEWER COUNT SOCKET ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message:
              err.message,
          },
        );
      }
    },
  );

  socket.on(
    "room:mute",
    async ({
      roomId,
      targetUserId,
      mute,
    }) => {
      try {
        const actorUserId =
          socket.data.userId;

        if (
          !roomId ||
          !actorUserId ||
          !targetUserId ||
          typeof mute !== "boolean"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Invalid mute request",
            },
          );
        }

        const targetParticipant =
          await Participant.findOne({
            roomId,
            userId: targetUserId,
            isActive: true,
          });

        if (!targetParticipant) {
          return socket.emit(
            "room:error",
            {
              message:
                "Target participant not found",
            },
          );
        }

        const isSelfMute =
          actorUserId.toString() ===
          targetUserId.toString();

        if (!isSelfMute) {
          const hostParticipant =
            await Participant.findOne({
              roomId,
              userId: actorUserId,
              role: "host",
              isActive: true,
            });

          if (!hostParticipant) {
            return socket.emit(
              "room:error",
              {
                message:
                  "Only host can mute another participant",
              },
            );
          }
        }

        targetParticipant.isMuted =
          mute;

        if (
          targetParticipant.micEnabled !==
          undefined
        ) {
          targetParticipant.micEnabled =
            !mute;
        }

        await targetParticipant.save();

        const payload = {
          roomId,
          userId: targetUserId,
          isMuted: mute,
          micEnabled: !mute,
          selfMute: isSelfMute,
          changedBy: actorUserId,
        };

        io.to(
          `room:${roomId}`,
        ).emit(
          "room:mute-updated",
          payload,
        );

        if (
          targetParticipant.socketId
        ) {
          io.to(
            targetParticipant.socketId,
          ).emit(
            "room:mute-control",
            payload,
          );
        }

        console.log(
          "ROOM MUTE UPDATED =>",
          {
            roomId,
            actorUserId,
            targetUserId,
            mute,
            selfMute: isSelfMute,
          },
        );
      } catch (err) {
        console.log(
          "ROOM MUTE ERROR =>",
          err,
        );

        socket.emit(
          "room:error",
          {
            message:
              err.message,
          },
        );
      }
    },
  );
  // ROOM END
  socket.on(
    "room:end",
    async ({ roomId }) => {
      try {
        const hostId = socket.data.userId;

        console.log("🔥 ROOM END REQUEST =>", {
          roomId,
          hostId,
          socketId: socket.id,
        });

        if (!roomId || !hostId) {
          return socket.emit("room:error", {
            message: "Invalid room end request",
          });
        }

        const room = await Room.findById(roomId);

        if (!room) {
          return socket.emit("room:error", {
            message: "Room not found",
          });
        }

        if (room.status === "ended") {
          return socket.emit("room:error", {
            message: "Room already ended",
          });
        }

        if (room.hostId?.toString() !== hostId.toString()) {
          return socket.emit("room:error", {
            message: "Only room host can end the room",
          });
        }

        const host = await Participant.findOne({
          roomId,
          userId: hostId,
          role: "host",
          isActive: true,
        });

        if (!host) {
          return socket.emit("room:error", {
            message: "Active host participant not found",
          });
        }

        room.status = "ended";
        room.endedAt = new Date();

        await room.save();

        const socketRoom = `room:${roomId}`;

        io.to(socketRoom).emit(
          "room:ended",
          {
            roomId,
            hostId,
            message: "Room has been ended by host",
          },
        );

        await Participant.updateMany(
          {
            roomId,
          },


          {
            $set: {
              isActive: false,
              leftAt: new Date(),
              socketId: null,
              seatIndex: null,
              role: "audience",
              isHandRaised: false,
              requestedSeatIndex: null,
              isMuted: false,
              micEnabled: false,
            },
          },
        );


        const roomSockets = await io
          .in(socketRoom)
          .fetchSockets();

        console.log(
          "ROOM SOCKETS BEFORE LEAVE =>",
          roomSockets.map((item) => item.id),
        );

        for (const roomSocket of roomSockets) {
          roomSocket.leave(socketRoom);
        }

        console.log(
          "✅ ALL SOCKETS REMOVED FROM ROOM =>",
          socketRoom,
        );

        await emitViewerCount(
          io,
          roomId,
        );

        await emitSpeakersUpdated(
          io,
          roomId,
        );

        console.log(
          "🔥 ROOM ENDED SUCCESSFULLY =>",
          {
            roomId,
            hostId,
            socketId: socket.id,
          },
        );
      } catch (err) {
        console.log(
          "❌ ROOM END ERROR =>",
          err,
        );

        socket.emit("room:error", {
          message: err.message,
        });
      }
    },
  );
  // REMOVE SPEAKER FROM ROOM 
  socket.on(
    "room:user-remove",
    async ({
      roomId,
      targetUserId,
    }) => {

      try {

        const hostId =
          socket.data.userId;

        const host =
          await Participant.findOne({
            roomId,
            userId: hostId,
            role: "host",
            isActive: true,
          });

        if (!host) {

          return socket.emit(
            "error",
            {
              message:
                "Only host can remove speaker",
            },
          );
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId:
              targetUserId,
            isActive: true,
          });

        if (!participant) {

          return socket.emit(
            "error",
            {
              message:
                "User not found",
            },
          );
        }

        participant.role =
          "audience";

        participant.seatIndex =
          null;

        participant.isMuted =
          false;

        participant.isHandRaised =
          false;

        participant.requestedSeatIndex =
          null;

        await participant.save();

        // Everyone refresh seat layout
        io.to(
          `room:${roomId}`,
        ).emit(
          "room:user-removed",
          {
            roomId,
            userId:
              targetUserId,
            message:
              "Speaker removed by host",
          },
        );

        io.to(
          `room:${roomId}`,
        ).emit(
          "room:speakers-updated",
          {
            roomId,
          },
        );

        // Removed user becomes audience
        if (
          participant.socketId
        ) {

          io.to(
            participant.socketId,
          ).emit(
            "room:removed-from-seat",
            {
              roomId,
              message:
                "You have been removed from speaker seat",
            },
          );
        }

        console.log(
          `USER REMOVED => ${targetUserId}`,
        );

      } catch (err) {

        console.log(
          "REMOVE USER SOCKET ERROR =>",
          err,
        );

        socket.emit(
          "error",
          {
            message:
              err.message,
          },
        );
      }
    },
  );

  /// SELF HOST/PARTICIOPANTS MUTE /UM MUTE 
  socket.on(
    "room:participant-mic",
    async ({
      roomId,
      userId,
      isMuted,
    }) => {
      try {
        const socketUserId =
          socket.data.userId;

        if (
          !roomId ||
          !socketUserId ||
          !userId ||
          typeof isMuted !== "boolean"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Invalid microphone request",
            },
          );
        }

        if (
          socketUserId.toString() !==
          userId.toString()
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "You can only control your own microphone",
            },
          );
        }

        const participant =
          await Participant.findOne({
            roomId,
            userId: socketUserId,
            isActive: true,
          });

        if (!participant) {
          return socket.emit(
            "room:error",
            {
              message:
                "Participant not found in room",
            },
          );
        }

        if (
          participant.role ===
          "host"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Host microphone is managed separately",
            },
          );
        }

        if (
          participant.role !==
          "speaker"
        ) {
          return socket.emit(
            "room:error",
            {
              message:
                "Only speakers can control microphone",
            },
          );
        }

        participant.isMuted =
          isMuted;

        participant.micEnabled =
          !isMuted;

        await participant.save();

        const payload = {
          roomId,
          userId:
            socketUserId,
          participantId:
            participant._id,
          isMuted,
          micEnabled:
            !isMuted,
        };

        io.to(
          `room:${roomId}`,
        ).emit(
          "room:participant-mic",
          payload,
        );

        console.log(
          "ROOM PARTICIPANT MIC =>",
          {
            roomId,
            userId:
              socketUserId,
            isMuted,
            micEnabled:
              !isMuted,
          },
        );
      } catch (error) {
        console.log(
          "ROOM PARTICIPANT MIC ERROR =>",
          error,
        );

        socket.emit(
          "room:error",
          {
            message:
              "Unable to update microphone",
          },
        );
      }
    },
  );

  /// DISCONNECT SOCKET

  socket.on("disconnect", async (reason) => {
    try {
      console.log(`Socket disconnected: ${id} - ${socket.id} - Reason: ${reason}`);

      // live viewer cleanup: the viewer row owned by THIS socket is removed, count + participants update
      await liveRoomService.handleSocketDisconnect(io, socket);

      // 1. Handle Participant Cleanup
      const participant = await Participant.findOne({ socketId: socket.id });

      if (participant) {
        participant.isActive = false;
        participant.leftAt = new Date();
        participant.socketId = null;
        participant.isHandRaised = false;
        participant.requestedSeatIndex = null;
        participant.isMuted = false;
        participant.role = "audience";
        participant.seatIndex = null;

        await participant.save();

        const roomChannel = `room:${participant.roomId}`;

        io.to(roomChannel).emit("room:user-left", {
          roomId: participant.roomId,
          userId: participant.userId,
        });

        io.to(roomChannel).emit("room:user-updated", {
          roomId: participant.roomId,
          userId: participant.userId,
        });

        io.to(roomChannel).emit("room:speakers-updated", {
          roomId: participant.roomId,
        });

        await emitViewerCount(io, participant.roomId);

        console.log("USER DISCONNECTED =>", participant.userId);
      }

      // 2. Handle Global Room Active Sockets Check
      if (globalRoom) {
        const sockets = await io.in(globalRoom).fetchSockets();
        console.log("🔄 Checking active sockets in room:", sockets.length);

        if (sockets?.length === 0) {
          const personId = new mongoose.Types.ObjectId(id);
          console.log(`🔍 Fetching data for Id: ${personId}`);

          const host = await Host.findById(personId)
            .select("_id callId isLive liveHistoryId")
            .lean();

          if (host) {
            // Handle Host Active Call
            if (host.callId) {
              const callId = new mongoose.Types.ObjectId(host.callId);
              console.log(`📞 Host was in an active call. Ending Call ID: ${callId}`);

              io.socketsLeave(callId.toString());

              // a running LIVE is never wiped here: it is closed through the live lifecycle (grace period below)
              const keepLive = Boolean(host.isLive && host.liveHistoryId);
              const [callHistory] = await Promise.all([
                History.findById(callId).select("_id callStartTime"),
                Privatecall.deleteOne({ receiver: personId }),
                Host.updateOne(
                  { _id: personId },
                  {
                    $set: keepLive
                      ? { callId: null }
                      : {
                          isOnline: false,
                          isBusy: false,
                          isLive: false,
                          callId: null,
                          liveHistoryId: null,
                        },
                  }
                ),
              ]);

              if (callHistory) {
                callHistory.callConnect = false;
                callHistory.callEndTime = moment().tz("Asia/Kolkata").format();

                const start = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
                const end = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
                const duration = moment.utc(end.diff(start)).format("HH:mm:ss");
                callHistory.duration = duration;

                await Promise.all([
                  callHistory.save(),
                  Chat.findOneAndUpdate(
                    { callId: callHistory._id },
                    {
                      $set: {
                        callDuration: duration,
                        callType: 1, // 1 = Received Call
                        isRead: true,
                      },
                    },
                    { new: true }
                  ),
                ]);
              }
            }

            // Host Live Session: a dropped connection does NOT end the live at once (grace period, see
            // liveSocketHandlers.scheduleLiveDisconnectGrace). If the host does not return, the live is finalized once
            // (atomic + idempotent, shared with End Live / reaper / admin end).
            if (host.isLive && host.liveHistoryId) {
              console.log(`⏳ Host disconnected while live (${host.liveHistoryId}) - grace period started`);
              liveSocketHandlers.scheduleLiveDisconnectGrace(io, host._id, host.liveHistoryId, globalRoom);
              return;
            }

            // Final Host Reset
            await Host.updateOne(
              { _id: host._id },
              {
                $set: {
                  isOnline: false,
                  isBusy: false,
                  isLive: false,
                  liveHistoryId: null,
                  callId: null,
                },
              }
            );
          } else {
            // Handle Regular User
            const user = await User.findById(personId).select("_id callId").lean();

            if (user) {
              if (user.callId) {
                const callId = new mongoose.Types.ObjectId(user.callId);
                console.log(`📞 User was in an active call. Ending Call ID: ${callId}`);

                io.socketsLeave(callId.toString());

                const [callHistory] = await Promise.all([
                  History.findById(callId).select("_id callStartTime"),
                  Privatecall.deleteOne({ caller: personId }),
                  User.updateOne(
                    { _id: personId },
                    {
                      $set: {
                        isOnline: false,
                        isBusy: false,
                        isLive: false,
                        callId: null,
                        liveHistoryId: null,
                      },
                    }
                  ),
                ]);

                if (callHistory) {
                  callHistory.callConnect = false;
                  callHistory.callEndTime = moment().tz("Asia/Kolkata").format();

                  const start = moment.tz(callHistory.callStartTime, "Asia/Kolkata");
                  const end = moment.tz(callHistory.callEndTime, "Asia/Kolkata");
                  const duration = moment.utc(end.diff(start)).format("HH:mm:ss");
                  callHistory.duration = duration;

                  await Promise.all([
                    callHistory.save(),
                    Chat.updateOne(
                      { callId: callHistory._id },
                      {
                        $set: {
                          callDuration: duration,
                          callType: 1, // 1 = Received Call
                          isRead: true,
                        },
                      }
                    ),
                  ]);
                }
              }

              // Final User Reset
              await User.updateOne(
                { _id: user._id },
                {
                  $set: {
                    isOnline: false,
                    isBusy: false,
                    isLive: false,
                    liveHistoryId: null,
                    callId: null,
                  },
                }
              );
            }
          }
        }
      }
    } catch (err) {
      console.log("DISCONNECT SOCKET ERROR =>", err);
    }
  });
  // socket.on("disconnect", async (reason) => {
  //   try {
  //     console.log(
  //       `🔴 SOCKET DISCONNECTED => ID: ${id} | SOCKET: ${socket.id} | REASON: ${reason}`
  //     );

  //     const participant = await Participant.findOne({
  //       socketId: socket.id,
  //     });

  //     if (participant) {
  //       participant.isActive = false;
  //       participant.leftAt = new Date();
  //       participant.socketId = null;
  //       participant.isHandRaised = false;
  //       participant.requestedSeatIndex = null;
  //       participant.isMuted = false;
  //       participant.role = "audience";
  //       participant.seatIndex = null;

  //       await participant.save();

  //       const roomChannel =
  //         `room:${participant.roomId}`;

  //       io.to(roomChannel).emit(
  //         "room:user-left",
  //         {
  //           roomId: participant.roomId,
  //           userId: participant.userId,
  //         }
  //       );

  //       io.to(roomChannel).emit(
  //         "room:user-updated",
  //         {
  //           roomId: participant.roomId,
  //           userId: participant.userId,
  //         }
  //       );

  //       io.to(roomChannel).emit(
  //         "room:speakers-updated",
  //         {
  //           roomId: participant.roomId,
  //         }
  //       );

  //       await emitViewerCount(
  //         io,
  //         participant.roomId
  //       );

  //       console.log(
  //         "👤 PARTICIPANT CLEANUP =>",
  //         participant.userId.toString()
  //       );
  //     }

  //     if (
  //       !id ||
  //       !mongoose.Types.ObjectId.isValid(id)
  //     ) {
  //       console.log(
  //         "❌ INVALID SOCKET USER/HOST ID =>",
  //         id
  //       );
  //       return;
  //     }

  //     const personId =
  //       new mongoose.Types.ObjectId(id);

  //     const activeSockets =
  //       await io.fetchSockets();

  //     const personSockets =
  //       activeSockets.filter(
  //         (activeSocket) => {
  //           const activeGlobalRoom =
  //             activeSocket.handshake.query
  //               ?.globalRoom;

  //           if (
  //             typeof activeGlobalRoom !==
  //             "string"
  //           ) {
  //             return false;
  //           }

  //           const activeId =
  //             activeGlobalRoom.split(":")[1];

  //           return (
  //             activeId ===
  //             personId.toString()
  //           );
  //         }
  //       );

  //     console.log(
  //       "🔍 ACTIVE PERSON SOCKETS =>",
  //       {
  //         id: personId.toString(),
  //         socketId: socket.id,
  //         activeSockets:
  //           personSockets.length,
  //       }
  //     );

  //     if (personSockets.length > 0) {
  //       console.log(
  //         "🟢 PERSON STILL ONLINE => ACTIVE SOCKET EXISTS",
  //         {
  //           id: personId.toString(),
  //           activeSockets:
  //             personSockets.length,
  //         }
  //       );

  //       return;
  //     }

  //     const host =
  //       await Host.findById(personId)
  //         .select(
  //           "_id callId isLive liveHistoryId isOnline isBusy"
  //         )
  //         .lean();

  //     if (host) {
  //       console.log(
  //         "🎙️ HOST OFFLINE CLEANUP START =>",
  //         {
  //           hostId:
  //             host._id.toString(),
  //           isOnline:
  //             host.isOnline,
  //           isLive:
  //             host.isLive,
  //           isBusy:
  //             host.isBusy,
  //           callId:
  //             host.callId,
  //           liveHistoryId:
  //             host.liveHistoryId,
  //         }
  //       );

  //       if (host.callId) {
  //         try {
  //           const callId =
  //             new mongoose.Types.ObjectId(
  //               host.callId
  //             );

  //           console.log(
  //             "📞 HOST CALL END =>",
  //             callId.toString()
  //           );

  //           io.socketsLeave(
  //             callId.toString()
  //           );

  //           const callHistory =
  //             await History.findById(
  //               callId
  //             )
  //               .select(
  //                 "_id callStartTime"
  //               );

  //           await Privatecall.deleteOne({
  //             receiver: personId,
  //           });

  //           if (callHistory) {
  //             callHistory.callConnect =
  //               false;

  //             callHistory.callEndTime =
  //               moment()
  //                 .tz("Asia/Kolkata")
  //                 .format();

  //             if (
  //               callHistory.callStartTime
  //             ) {
  //               const start =
  //                 moment.tz(
  //                   callHistory.callStartTime,
  //                   "Asia/Kolkata"
  //                 );

  //               const end =
  //                 moment.tz(
  //                   callHistory.callEndTime,
  //                   "Asia/Kolkata"
  //                 );

  //               callHistory.duration =
  //                 moment
  //                   .utc(
  //                     end.diff(start)
  //                   )
  //                   .format("HH:mm:ss");
  //             }

  //             await callHistory.save();

  //             await Chat.findOneAndUpdate(
  //               {
  //                 callId:
  //                   callHistory._id,
  //               },
  //               {
  //                 $set: {
  //                   callDuration:
  //                     callHistory.duration,
  //                   callType: 1,
  //                   isRead: true,
  //                 },
  //               },
  //               {
  //                 new: true,
  //               }
  //             );

  //             console.log(
  //               "✅ HOST CALL HISTORY UPDATED"
  //             );
  //           }
  //         } catch (error) {
  //           console.error(
  //             "❌ HOST CALL CLEANUP ERROR =>",
  //             error
  //           );
  //         }
  //       }

  //       if (
  //         host.isLive &&
  //         host.liveHistoryId
  //       ) {
  //         try {
  //           const liveHistoryId =
  //             new mongoose.Types.ObjectId(
  //               host.liveHistoryId
  //             );

  //           console.log(
  //             "📴 HOST LIVE END =>",
  //             liveHistoryId.toString()
  //           );

  //           const liveHistory =
  //             await LiveBroadcastHistory.findById(
  //               liveHistoryId
  //             )
  //               .select("startTime")
  //               .lean();

  //           if (liveHistory) {
  //             const endTime =
  //               moment()
  //                 .tz("Asia/Kolkata")
  //                 .format();

  //             const start =
  //               moment.tz(
  //                 liveHistory.startTime,
  //                 "Asia/Kolkata"
  //               );

  //             const end =
  //               moment.tz(
  //                 endTime,
  //                 "Asia/Kolkata"
  //               );

  //             const duration =
  //               moment
  //                 .utc(
  //                   end.diff(start)
  //                 )
  //                 .format("HH:mm:ss");

  //             await LiveBroadcastHistory.updateOne(
  //               {
  //                 _id:
  //                   liveHistory._id,
  //               },
  //               {
  //                 $set: {
  //                   endTime,
  //                   duration,
  //                 },
  //               }
  //             );

  //             console.log(
  //               "✅ LIVE HISTORY CLOSED =>",
  //               {
  //                 liveHistoryId:
  //                   liveHistory._id.toString(),
  //                 duration,
  //               }
  //             );
  //           }

  //           await Promise.all([
  //             LiveBroadcastView.deleteMany({
  //               liveHistoryId,
  //             }),

  //             LiveBroadcaster.deleteOne({
  //               hostId: personId,
  //               liveHistoryId,
  //             }),
  //           ]);

  //           console.log(
  //             "✅ LIVE VIEW/BROADCASTER CLEANUP COMPLETED"
  //           );
  //         } catch (error) {
  //           console.error(
  //             "❌ HOST LIVE CLEANUP ERROR =>",
  //             error
  //           );
  //         }
  //       }

  //       await Host.updateOne(
  //         {
  //           _id: personId,
  //         },
  //         {
  //           $set: {
  //             isOnline: false,
  //             isBusy: false,
  //             isLive: false,
  //             liveHistoryId: null,
  //             callId: null,
  //           },
  //         }
  //       );

  //       console.log(
  //         "🔴 HOST OFFLINE =>",
  //         personId.toString()
  //       );

  //       await emitHostStatusUpdate(
  //         io,
  //         personId
  //       );

  //       console.log(
  //         "📡 HOST OFFLINE STATUS SENT =>",
  //         personId.toString()
  //       );

  //       return;
  //     }

  //     const user =
  //       await User.findById(personId)
  //         .select(
  //           "_id callId isOnline isBusy isLive liveHistoryId"
  //         )
  //         .lean();

  //     if (!user) {
  //       console.log(
  //         "❌ USER/HOST NOT FOUND =>",
  //         personId.toString()
  //       );
  //       return;
  //     }

  //     console.log(
  //       "👤 USER OFFLINE CLEANUP START =>",
  //       {
  //         userId:
  //           user._id.toString(),
  //         isOnline:
  //           user.isOnline,
  //         isBusy:
  //           user.isBusy,
  //         callId:
  //           user.callId,
  //       }
  //     );

  //     if (user.callId) {
  //       try {
  //         const callId =
  //           new mongoose.Types.ObjectId(
  //             user.callId
  //           );

  //         console.log(
  //           "📞 USER CALL END =>",
  //           callId.toString()
  //         );

  //         io.socketsLeave(
  //           callId.toString()
  //         );

  //         const callHistory =
  //           await History.findById(
  //             callId
  //           )
  //             .select(
  //               "_id callStartTime"
  //             );

  //         await Privatecall.deleteOne({
  //           caller: personId,
  //         });

  //         if (callHistory) {
  //           callHistory.callConnect =
  //             false;

  //           callHistory.callEndTime =
  //             moment()
  //               .tz("Asia/Kolkata")
  //               .format();

  //           if (
  //             callHistory.callStartTime
  //           ) {
  //             const start =
  //               moment.tz(
  //                 callHistory.callStartTime,
  //                 "Asia/Kolkata"
  //               );

  //             const end =
  //               moment.tz(
  //                 callHistory.callEndTime,
  //                 "Asia/Kolkata"
  //               );

  //             callHistory.duration =
  //               moment
  //                 .utc(
  //                   end.diff(start)
  //                 )
  //                 .format("HH:mm:ss");
  //           }

  //           await callHistory.save();

  //           await Chat.findOneAndUpdate(
  //             {
  //               callId:
  //                 callHistory._id,
  //             },
  //             {
  //               $set: {
  //                 callDuration:
  //                   callHistory.duration,
  //                 callType: 2,
  //                 isRead: true,
  //               },
  //             },
  //             {
  //               new: true,
  //             }
  //           );

  //           console.log(
  //             "✅ USER CALL HISTORY UPDATED"
  //           );
  //         }
  //       } catch (error) {
  //         console.error(
  //           "❌ USER CALL CLEANUP ERROR =>",
  //           error
  //         );
  //       }
  //     }

  //     await User.updateOne(
  //       {
  //         _id: personId,
  //       },
  //       {
  //         $set: {
  //           isOnline: false,
  //           isBusy: false,
  //           isLive: false,
  //           liveHistoryId: null,
  //           callId: null,
  //         },
  //       }
  //     );

  //     console.log(
  //       "🔴 USER OFFLINE =>",
  //       personId.toString()
  //     );
  //   } catch (error) {
  //     console.error(
  //       "❌ DISCONNECT SOCKET ERROR =>",
  //       error
  //     );
  //   }
  // });

});

// used by services/liveAnalytics.service.js (admin end-room)
module.exports = { emitHostStatusUpdate };
