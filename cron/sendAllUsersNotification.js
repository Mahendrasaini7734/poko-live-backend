const User = require("../models/user.model");
const notificationService = require("../services/notification.service");

const BATCH_SIZE = 500;

const sendAllUsersNotification = async ({
  title,
  body,
  data = {},
}) => {
  console.log("========================================");
  console.log("ZIGO NOTIFICATION JOB STARTED");
  console.log("Title:", title);
  console.log("========================================");

  const totalUsers = await User.countDocuments({});

  const eligibleUsers = await User.countDocuments({
    isBlock: true,
    fcmToken: {
      $type: "string",
      $ne: "",
    },
  });

  console.log("Total Users:", totalUsers);
  console.log("Eligible Users:", eligibleUsers);

  let lastId = null;
  let processedUsers = 0;
  let totalTokens = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  const errorCounts = {};

  while (true) {
    const query = {
      isBlock: false,
      fcmToken: {
        $type: "string",
        $ne: "",
      },
    };

    if (lastId) {
      query._id = {
        $gt: lastId,
      };
    }

    const users = await User.find(query)
      .select("_id fcmToken")
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .lean();

    if (!users.length) {
      break;
    }

    const tokens = [
      ...new Set(
        users
          .map((user) => user.fcmToken)
          .filter(
            (token) =>
              typeof token === "string" &&
              token.trim().length > 0
          )
      ),
    ];

    console.log(
      `Batch: Users=${users.length}, Tokens=${tokens.length}`
    );

    if (tokens.length > 0) {
      const result =
        await notificationService.sendMulticastNotification({
          tokens,
          title,
          body,
          data,
        });

      totalTokens += result.totalTokens || 0;
      totalSuccess += result.successCount || 0;
      totalFailed += result.failureCount || 0;

      Object.entries(
        result.errorCounts || {}
      ).forEach(([code, count]) => {
        errorCounts[code] =
          (errorCounts[code] || 0) + count;
      });

    }

    processedUsers += users.length;

    lastId =
      users[users.length - 1]._id;

    console.log(
      `Processed=${processedUsers}, Success=${totalSuccess}, Failed=${totalFailed}`
    );

    if (users.length < BATCH_SIZE) {
      break;
    }
  }

  const finalResult = {
    totalUsers,
    eligibleUsers,
    processedUsers,
    totalTokens,
    totalSuccess,
    totalFailed,
    errorCounts,
  };

  console.log("========================================");
  console.log("ZIGO NOTIFICATION JOB COMPLETED");
  console.log(finalResult);
  console.log("FCM TOKENS WERE NOT DELETED OR MODIFIED");
  console.log("========================================");

  return finalResult;
};

module.exports = sendAllUsersNotification;