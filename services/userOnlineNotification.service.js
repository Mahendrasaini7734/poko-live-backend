const {
  getRandomUserOnlineNotification,
} = require("../util/getRandomUserOnlineNotification");

const Host = require("../models/host.model");
const notificationService = require("../services/notification.service");
const { getMediaUrl } = require("../util/media");

async function sendUserOnlineNotificationToHosts(user) {
  try {
    if (!user?._id) {
      console.error(
        "❌ USER ONLINE → INVALID USER"
      );

      return {
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    const hosts = await Host.find({
      status: 2,
      isBlock: false,
      fcmToken: {
        $exists: true,
        $type: "string",
        $ne: "",
      },
    })
      .select("_id userId name fcmToken")
      .lean();

    console.log(
      "👤 USER ONLINE → HOSTS FOUND:",
      hosts.length
    );

    const tokens = [
      ...new Set(
        hosts
          .map((host) =>
            typeof host.fcmToken === "string"
              ? host.fcmToken.trim()
              : ""
          )
          .filter(Boolean)
      ),
    ];

    console.log(
      "👤 USER ONLINE → UNIQUE HOST TOKENS:",
      tokens.length
    );

    if (!tokens.length) {
      console.log(
        "⚠️ USER ONLINE → NO HOST FCM TOKENS FOUND"
      );

      return {
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    const userName =
      String(user.name || "User").trim();

    const senderImage = getMediaUrl(
      user?.image?.url ||
      user?.image ||
      ""
    );

    const notification =
      getRandomUserOnlineNotification(
        userName
      );

    const notificationTitle =
      `${userName} is Online`;

    const notificationBody =
      notification?.body ||
      `🔥 ${userName} just came online.`;

    console.log(
      "👤 USER ONLINE → USER ID:",
      String(user._id)
    );

    console.log(
      "👤 USER ONLINE → USER NAME:",
      userName
    );

    console.log(
      "🖼️ USER ONLINE → USER IMAGE:",
      senderImage
    );

    console.log(
      "🔔 USER ONLINE → TITLE:",
      notificationTitle
    );

    console.log(
      "📝 USER ONLINE → BODY:",
      notificationBody
    );

    const chunkSize = 500;

    let totalSuccess = 0;
    let totalFailure = 0;

    for (
      let i = 0;
      i < tokens.length;
      i += chunkSize
    ) {
      const tokenChunk = tokens.slice(
        i,
        i + chunkSize
      );

      const chunkNumber =
        Math.floor(i / chunkSize) + 1;

      try {
        const result =
          await notificationService.sendMulticastNotification({
            tokens: tokenChunk,

            title:
              notificationTitle,

            body:
              notificationBody,

            data: {
              title:
                notificationTitle,

              body:
                notificationBody,

              type:
                "USER_ONLINE",

              userId:
                String(user._id),

              userName:
                userName,

              senderName:
                userName,

              name:
                userName,

              senderImage:
                String(senderImage),

              image:
                String(senderImage),

              userImage:
                String(senderImage),

              senderRole:
                "user",

              receiverRole:
                "host",

              screen:
                "home",
            },
          });

        const successCount =
          Number(
            result?.successCount || 0
          );

        const failureCount =
          Number(
            result?.failureCount || 0
          );

        totalSuccess +=
          successCount;

        totalFailure +=
          failureCount;

        console.log(
          `✅ USER ONLINE → CHUNK ${chunkNumber} RESULT:`,
          {
            successCount,
            failureCount,
            total:
              tokenChunk.length,
          }
        );
      } catch (error) {
        totalFailure +=
          tokenChunk.length;

        console.error(
          `❌ USER ONLINE → CHUNK ${chunkNumber} FCM ERROR =>`,
          error.code,
          error.message
        );
      }
    }

    const finalResult = {
      userId:
        String(user._id),

      userName,

      senderName:
        userName,

      senderImage,

      totalTokens:
        tokens.length,

      totalSuccess,

      totalFailure,

      title:
        notificationTitle,

      body:
        notificationBody,
    };

    console.log(
      "🎯 USER ONLINE → HOST FINAL RESULT =>",
      finalResult
    );

    return finalResult;
  } catch (error) {
    console.error(
      "❌ USER ONLINE HOST QUERY ERROR =>",
      error.code,
      error.message
    );

    return {
      totalTokens: 0,
      totalSuccess: 0,
      totalFailure: 0,
      error:
        error.message,
    };
  }
}

module.exports = {
  sendUserOnlineNotificationToHosts,
};