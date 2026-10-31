const Impression = require("../../models/impression.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const Agency = require("../../models/agency.model");
const History = require("../../models/history.model");
const LiveBroadcaster = require("../../models/liveBroadcaster.model");
const WithdrawalRequest = require("../../models/withdrawalRequest.model");
//get dashboard count
exports.fetchDashboardMetrics = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};

    if (
      startDate !== "All" &&
      endDate !== "All"
    ) {
      const from = new Date(startDate);
      const to = new Date(endDate);

      if (
        Number.isNaN(from.getTime()) ||
        Number.isNaN(to.getTime())
      ) {
        return res.status(200).json({
          status: false,
          message: "Invalid date range.",
        });
      }

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: from,
          $lte: to,
        },
      };
    }

    const COINS_PER_RUPEE = 1000;
    const RUPEES_PER_1000_COINS = 25;

    const coinToRupee = {
      $multiply: [
        {
          $convert: {
            input: "$$value",
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
        RUPEES_PER_1000_COINS / COINS_PER_RUPEE,
      ],
    };

    const [
      totalUsers,
      totalBlockedUsers,
      totalVipUsers,
      totalPendingHosts,
      totalHosts,
      totalAgency,
      totalImpressions,
      totalCurrentLiveHosts,

      financialData,

      payoutData,
    ] = await Promise.all([
      User.countDocuments({
        ...dateFilterQuery,
      }),

      User.countDocuments({
        ...dateFilterQuery,
        isBlock: true,
      }),

      User.countDocuments({
        ...dateFilterQuery,
        isVip: true,
      }),

      Host.countDocuments({
        ...dateFilterQuery,
        status: 1,
        agencyId: null,
      }),

      Host.countDocuments({
        ...dateFilterQuery,
        status: 2,
        isFake: false,
      }),

      Agency.countDocuments({
        ...dateFilterQuery,
      }),

      Impression.countDocuments({
        ...dateFilterQuery,
      }),

      LiveBroadcaster.countDocuments({
        ...dateFilterQuery,
      }),

      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
          },
        },

        {
          $group: {
            _id: null,

            grossPaymentsCollected: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$type", 7],
                  },
                  {
                    $convert: {
                      input: "$price",
                      to: "double",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  0,
                ],
              },
            },

            coinsSold: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$type", 7],
                  },
                  {
                    $convert: {
                      input: "$userCoin",
                      to: "double",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  0,
                ],
              },
            },

            adminCoins: {
              $sum: {
                $convert: {
                  input: "$adminCoin",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },

            hostCoins: {
              $sum: {
                $convert: {
                  input: "$hostCoin",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },

            agencyCoins: {
              $sum: {
                $convert: {
                  input: "$agencyCoin",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            grossPaymentsCollected: 1,

            coinsSold: 1,

            adminCommissionEarned: {
              $multiply: [
                "$adminCoins",
                0.025,
              ],
            },

            hostEarningsGenerated: {
              $multiply: [
                "$hostCoins",
                0.025,
              ],
            },

            agencyEarningsGenerated: {
              $multiply: [
                "$agencyCoins",
                0.025,
              ],
            },
          },
        },
      ]),

      WithdrawalRequest.aggregate([
        {
          $match: {
            ...dateFilterQuery,
          },
        },

        {
          $group: {
            _id: null,

            hostPayoutsCompleted: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", 3],
                  },
                  {
                    $convert: {
                      input: "$amount",
                      to: "double",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  0,
                ],
              },
            },

            pendingPayoutLiability: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", 1],
                  },
                  {
                    $convert: {
                      input: "$amount",
                      to: "double",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const financial =
      financialData?.[0] || {};

    const payout =
      payoutData?.[0] || {};

    const dashboardData = {
      totalUsers,
      totalBlockedUsers,
      totalVipUsers,
      totalPendingHosts,
      totalHosts,
      totalAgency,
      totalImpressions,
      totalCurrentLiveHosts,

      grossPaymentsCollected: Number(
        Number(
          financial.grossPaymentsCollected || 0
        ).toFixed(2)
      ),

      coinsSold: Number(
        financial.coinsSold || 0
      ),

      adminCommissionEarned: Number(
        Number(
          financial.adminCommissionEarned || 0
        ).toFixed(2)
      ),

      hostEarningsGenerated: Number(
        Number(
          financial.hostEarningsGenerated || 0
        ).toFixed(2)
      ),

      agencyEarningsGenerated: Number(
        Number(
          financial.agencyEarningsGenerated || 0
        ).toFixed(2)
      ),

      hostPayoutsCompleted: Number(
        Number(
          payout.hostPayoutsCompleted || 0
        ).toFixed(2)
      ),

      pendingPayoutLiability: Number(
        Number(
          payout.pendingPayoutLiability || 0
        ).toFixed(2)
      ),
    };

    console.log("Dashboard Financial:", {
      gross: dashboardData.grossPaymentsCollected,
      coins: dashboardData.coinsSold,
      admin: dashboardData.adminCommissionEarned,
      host: dashboardData.hostEarningsGenerated,
      agency: dashboardData.agencyEarningsGenerated,
    });

    return res.status(200).json({
      status: true,
      message:
        "Dashboard metrics retrieved successfully.",
      data: dashboardData,
      dashboardData,
    });
  } catch (error) {
    console.error(
      "fetchDashboardMetrics Error:",
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

//get chat analytic
exports.retrieveChartStats = async (req, res) => {
  try {
    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be requried!" });
    }

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";
    const type = req.query.type.trim().toLowerCase();

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const formatStartDate = new Date(startDate);
      const formatEndDate = new Date(endDate);
      formatEndDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: formatStartDate,
          $lte: formatEndDate,
        },
      };
    }

    if (type === "user") {
      const data = await User.aggregate([
        {
          $match: dateFilterQuery,
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return res.status(200).json({ status: true, message: "Success", chartUser: data });
    } else if (type === "host") {
      const data = await Host.aggregate([
        {
          $match: { ...dateFilterQuery, status: 2 },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return res.status(200).json({ status: true, message: "Success", chartHost: data });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get new user
exports.getNewUsers = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const filter = { ...dateFilterQuery };

    const users = await User.aggregate([
      { $match: filter },
      {
        $project: {
          _id: 1,
          uniqueId: 1,
          name: 1,
          email: 1,
          image: 1,
          countryFlagImage: 1,
          country: 1,
          gender: 1,
          coin: 1,
          isOnline: 1,
          loginType: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: "Newly signed up users retrieved successfully!",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get top agency
exports.getTopPerformingAgencies = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery.createdAt = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    }

    const filter = {
      ...dateFilterQuery,
      totalEarnings: { $gt: 0 },
    };

    const topAgencies = await Agency.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "hosts",
          localField: "_id",
          foreignField: "agencyId",
          as: "hosts",
        },
      },
      {
        $addFields: {
          hostsCount: { $size: "$hosts" },
          totalEarnings: { $round: ["$totalEarnings", 2] },
        },
      },
      {
        $project: {
          _id: 1,
          agencyCode: 1,
          name: 1,
          image: 1,
          commission: 1,
          countryFlagImage: 1,
          country: 1,
          totalEarnings: 1,
          createdAt: 1,
          hostsCount: 1,
        },
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: "Top performing agencies retrieved successfully 🏆",
      data: topAgencies,
    });
  } catch (error) {
    console.error("Error fetching top performing agencies:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get top performing hosts
exports.getTopPerformingHosts = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery.createdAt = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    }

    const filter = {
      ...dateFilterQuery,
      isFake: false,
      coin: { $gt: 0 },
    };

    const topHosts = await Host.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "agencies",
          localField: "agencyId",
          foreignField: "_id",
          as: "agency",
        },
      },
      {
        $unwind: {
          path: "$agency",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          uniqueId: 1,
          name: 1,
          image: 1,
          countryFlagImage: 1,
          country: 1,
          coin: 1,
          isOnline: 1,
          createdAt: 1,
          agencyName: { $ifNull: ["$agency.name", ""] },
        },
      },
      { $sort: { coin: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: "Top performing hosts retrieved successfully ✅",
      data: topHosts,
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get top spenders
exports.fetchTopSpenders = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const topSpenders = await History.aggregate([
      {
        $match: {
          ...dateFilterQuery,
          type: { $in: [2, 3, 9, 10, 11, 12, 13] },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalCoinsSpent: { $sum: "$userCoin" },
        },
      },
      {
        $sort: { totalCoinsSpent: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          //userId: "$_id",
          totalCoinsSpent: 1,
          name: "$user.name",
          image: "$user.image",
          email: "$user.email",
          countryFlagImage: "$user.countryFlagImage",
          country: "$user.country",
          isVip: "$user.isVip",
        },
      },
    ]);

    res.status(200).json({
      status: true,
      message: "Top spenders fetched successfully",
      data: topSpenders,
    });
  } catch (error) {
    console.error("Top Spenders Error:", error);
    res.status(500).json({ status: false, message: "Something went wrong", error: error.message });
  }
};
