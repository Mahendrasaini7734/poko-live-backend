const {
  getRandomHostOnlineNotification,
} = require("../util/getRandomHostOnlineNotification");

const User = require("../models/user.model");
const notificationService = require("../services/notification.service");
const { getMediaUrl } = require("../util/media");

async function sendHostOnlineNotificationToUsers(host) {
  try {
    if (!host?._id) {
      console.error(
        "❌ HOST ONLINE → INVALID HOST"
      );

      return {
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    const users = await User.find({
      _id: {
        $ne: host.userId,
      },
      isBlock: false,
      fcmToken: {
        $exists: true,
        $type: "string",
        $ne: "",
      },
    })
      .select("_id fcmToken")
      .lean();

    const tokens = [
      ...new Set(
        users
          .map((user) =>
            typeof user.fcmToken === "string"
              ? user.fcmToken.trim()
              : ""
          )
          .filter(Boolean)
      ),
    ];

    console.log(
      "🔴 HOST ONLINE → USERS FOUND:",
      users.length
    );

    console.log(
      "🔴 HOST ONLINE → UNIQUE FCM TOKENS:",
      tokens.length
    );

    if (!tokens.length) {
      console.log(
        "⚠️ HOST ONLINE → NO USER FCM TOKENS FOUND"
      );

      return {
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    const hostName = String(
      host.name || "Host"
    );

    const notification =
      getRandomHostOnlineNotification(
        hostName
      );

    const senderImage = getMediaUrl(
      host.image?.url ||
        host.image ||
        ""
    );

    console.log(
      "🖼️ HOST ONLINE → IMAGE:",
      senderImage
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
            title: notification.title,
            body: notification.body,
            data: {
              title: notification.title,
              body: notification.body,
              type: "HOST_ONLINE",
              hostId: String(host._id),
              hostName,
              name: hostName,
              image: senderImage,
              senderImage,
              screen: "live",
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

    
      } catch (error) {
        totalFailure +=
          tokenChunk.length;

        console.error(
          `❌ HOST ONLINE → CHUNK ${chunkNumber} FCM ERROR =>`,
          error.code,
          error.message
        );
      }
    }

    const finalResult = {
      hostId: String(host._id),
      hostName,
      senderImage,
      totalTokens: tokens.length,
      totalSuccess,
      totalFailure,
      title: notification.title,
      body: notification.body,
    };

    console.log(
      "🎯 HOST ONLINE → USER FINAL RESULT =>",
      finalResult
    );

    return finalResult;
  } catch (error) {
    console.error(
      "❌ HOST ONLINE USER QUERY ERROR =>",
      error.code,
      error.message
    );

    return {
      totalTokens: 0,
      totalSuccess: 0,
      totalFailure: 0,
      error: error.message,
    };
  }
}

module.exports = {
  sendHostOnlineNotificationToUsers,
};