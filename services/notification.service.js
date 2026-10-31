const firebase = require("../util/privateKey");

const sendMulticastNotification = async ({
  tokens,
  title,
  body,
  imageUrl = "",
  data = {},
}) => {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return {
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      errorCounts: {},
    };
  }

  const uniqueTokens = [
    ...new Set(
      tokens.filter(
        (token) =>
          typeof token === "string" &&
          token.trim().length > 0
      )
    ),
  ];

  if (!uniqueTokens.length) {
    return {
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      errorCounts: {},
    };
  }

  if (uniqueTokens.length > 500) {
    throw new Error(
      `Maximum 500 tokens allowed per request. Received ${uniqueTokens.length}`
    );
  }

  const notification = {
    title,
    body,
  };

  if (imageUrl) {
    notification.imageUrl = imageUrl;
  }

  const message = {
    tokens: uniqueTokens,

    notification,

    data: Object.fromEntries(
      Object.entries(data).map(
        ([key, value]) => [
          String(key),
          String(value),
        ]
      )
    ),

    android: {
      priority: "high",

      notification: {
        channelId: "zigo_default",
        sound: "default",

        ...(imageUrl
          ? {
              imageUrl: imageUrl,
            }
          : {}),
      },
    },

    apns: {
      payload: {
        aps: {
          sound: "default",

          ...(imageUrl
            ? {
                "mutable-content": 1,
              }
            : {}),
        },
      },

      ...(imageUrl
        ? {
            fcmOptions: {
              imageUrl: imageUrl,
            },
          }
        : {}),
    },
  };

  try {
    const response =
      await firebase.messaging.sendEachForMulticast(
        message
      );

    const invalidTokens = [];
    const errorCounts = {};

    response.responses.forEach(
      (result, index) => {
        if (result.success) {
          return;
        }

        const errorCode =
          result.error?.code || "UNKNOWN";

        const errorMessage =
          result.error?.message ||
          "Unknown error";

        errorCounts[errorCode] =
          (errorCounts[errorCode] || 0) + 1;

      

        if (
          errorCode ===
            "messaging/registration-token-not-registered" ||
          errorCode ===
            "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(
            uniqueTokens[index]
          );
        }
      }
    );

    const result = {
      totalTokens: uniqueTokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
      errorCounts,
    };



    return result;
  } catch (error) {
    console.error(
      "ZIGO MULTICAST ERROR:",
      error.code || "UNKNOWN",
      error.message
    );

    throw error;
  }
};

module.exports = {
  sendMulticastNotification,
};