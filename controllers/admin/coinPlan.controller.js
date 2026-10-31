const CoinPlan = require("../../models/coinPlan.model");
const History = require("../../models/history.model");

const mongoose = require("mongoose");

const {
  getMediaUrl
} = require("../../util/media");



//create a new coin plan
exports.createCoinPlan = async (req, res) => {
  try {
    const { coins, bonusCoins, price, iconUrl, productId } = req.body;

    if (!coins || !price || !productId) {
      return res.status(200).json({ status: false, message: "Invalid details provided." });
    }

    const coinPlan = new CoinPlan({ coins, bonusCoins, price, iconUrl, productId });
    await coinPlan.save();

    return res.status(200).json({ status: true, message: "Coin plan created successfully.", data: coinPlan });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update an existing coin plan
exports.modifyCoinPlan = async (req, res) => {
  try {
    const { coinPlanId } = req.body;
    if (!coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId is required." });
    }

    const coinPlan = await CoinPlan.findById(coinPlanId).lean();
    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    const updateFields = {
      coins: req.body.coins !== undefined ? Number(req.body.coins) : coinPlan.coins,
      bonusCoins: req.body.bonusCoins !== undefined ? Number(req.body.bonusCoins) : coinPlan.bonusCoins,
      price: req.body.price !== undefined ? Number(req.body.price) : coinPlan.price,
      iconUrl: req.body.iconUrl || coinPlan.iconUrl,
      productId: req.body.productId || coinPlan.productId,
    };

    const updatedCoinPlan = await CoinPlan.findByIdAndUpdate(coinPlanId, updateFields, {
      new: true,
      select: "coins bonusCoins price iconUrl productId isActive isFeatured",
      lean: true,
    });

    return res.status(200).json({ status: true, message: "Coin plan updated successfully.", data: updatedCoinPlan });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//toggle coin plan status (isActive or isFeatured)
exports.toggleCoinPlanStatus = async (req, res) => {
  try {
    const { coinPlanId, field } = req.query;

    if (!coinPlanId || !["isActive", "isFeatured"].includes(field)) {
      return res.status(200).json({ status: false, message: "Valid coinPlanId and field (isActive or isFeatured) are required." });
    }

    const coinPlan = await CoinPlan.findById(coinPlanId).select("isActive isFeatured").lean();
    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    const updateField = field === "isActive" ? { isActive: !coinPlan.isActive } : { isFeatured: !coinPlan.isFeatured };
    const updatedCoinPlan = await CoinPlan.findByIdAndUpdate(coinPlanId, updateField, { new: true }).lean();

    return res.status(200).json({ status: true, message: "Coin plan status updated successfully.", data: updatedCoinPlan });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete a coin plan
exports.removeCoinPlan = async (req, res) => {
  try {
    const { coinPlanId } = req.query;
    if (!coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId is required." });
    }

    const coinPlan = await CoinPlan.findById(coinPlanId).select("_id").lean();
    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    res.status(200).json({ status: true, message: "Coin plan deleted successfully." });

    await CoinPlan.deleteOne({ _id: coinPlanId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//retrieve all coin plans
exports.fetchCoinPlans = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const coinPlans = await CoinPlan.find()
      .select("coins bonusCoins price iconUrl productId isActive isFeatured")
      .sort({ coins: 1, price: 1 })
      .skip((start - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({ status: true, message: "Coin plans retrieved successfully.", data: coinPlans });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get coinplan histories of users (admin earning)
exports.retrieveUserPurchaseRecords = async (req, res) => {
  try {

    const page = Math.max(
      parseInt(req.query.start) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

  
    const {
      userId,
      paymentGateway,
      search,
      startDate = "All",
      endDate = "All",
    } = req.query;

    // =================================================
    // BASE FILTER
    // =================================================

    const matchStage = {
      type: 7,
    };

    // =================================================
    // USER FILTER
    // =================================================

    if (
      userId &&
      mongoose.Types.ObjectId.isValid(userId)
    ) {
      matchStage.userId =
        new mongoose.Types.ObjectId(userId);
    }

    // =================================================
    // PAYMENT GATEWAY FILTER
    // =================================================

    if (
      paymentGateway &&
      paymentGateway !== "All"
    ) {
      matchStage.paymentGateway = {
        $regex: String(
          paymentGateway
        ).trim(),
        $options: "i",
      };
    }

    // =================================================
    // DATE FILTER
    // =================================================

    if (
      startDate !== "All" &&
      endDate !== "All"
    ) {
      const fromDate = new Date(
        startDate
      );

      const toDate = new Date(
        endDate
      );

      if (
        !Number.isNaN(
          fromDate.getTime()
        ) &&
        !Number.isNaN(
          toDate.getTime()
        )
      ) {
        fromDate.setHours(
          0,
          0,
          0,
          0
        );

        toDate.setHours(
          23,
          59,
          59,
          999
        );

        matchStage.createdAt = {
          $gte: fromDate,
          $lte: toDate,
        };
      }
    }

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "=========================================="
    );

    console.log(
      "COIN PLAN PURCHASE HISTORY"
    );

    console.log(
      "Match Stage:",
      matchStage
    );

    // =================================================
    // SEARCH
    // =================================================
    // Search is done after user lookup.
    // =================================================

    const pipeline = [
      // ===============================================
      // HISTORY
      // ===============================================

      {
        $match: matchStage,
      },

      // ===============================================
      // USER LOOKUP
      // ===============================================

      {
        $lookup: {
          from: "users",

          localField: "userId",

          foreignField: "_id",

          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                userName: 1,
                uniqueId: 1,
                image: 1,
              },
            },
          ],

          as: "userDetails",
        },
      },

      // ===============================================
      // USER DATA
      // ===============================================

      {
        $unwind: {
          path: "$userDetails",

          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // =================================================
    // SEARCH FILTER
    // =================================================

    if (
      search &&
      String(search).trim()
    ) {
      const searchValue =
        String(search).trim();

      pipeline.push({
        $match: {
          $or: [
            {
              "userDetails.name": {
                $regex:
                  searchValue,
                $options: "i",
              },
            },

            {
              "userDetails.userName": {
                $regex:
                  searchValue,
                $options: "i",
              },
            },

            {
              "userDetails.uniqueId": {
                $regex:
                  searchValue,
                $options: "i",
              },
            },

            {
              paymentGateway: {
                $regex:
                  searchValue,
                $options: "i",
              },
            },

            {
              uniqueId: {
                $regex:
                  searchValue,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // =================================================
    // SORT
    // =================================================

    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });

    // =================================================
    // FACET
    // =================================================

    pipeline.push({
      $facet: {
        // =============================================
        // DATA
        // =============================================

        data: [
          {
            $skip: skip,
          },

          {
            $limit: limit,
          },

          // ===========================================
          // RESPONSE FORMAT
          // ===========================================

          {
            $project: {
              _id: 1,

              userId: 1,

              type: 1,

              uniqueId: 1,

              userCoin: 1,

              bonusCoins: 1,

              price: 1,

              paymentGateway: 1,

              date: 1,

              createdAt: 1,

              updatedAt: 1,

              // =======================================
              // USER
              // =======================================

              user: {
                _id:
                  "$userDetails._id",

                name: {
                  $ifNull: [
                    "$userDetails.name",
                    "",
                  ],
                },

                userName: {
                  $ifNull: [
                    "$userDetails.userName",
                    "",
                  ],
                },

                uniqueId: {
                  $ifNull: [
                    "$userDetails.uniqueId",
                    "",
                  ],
                },

                image: {
                  $ifNull: [
                    "$userDetails.image",
                    "",
                  ],
                },
              },
            },
          },
        ],

        // =============================================
        // TOTAL RECORDS
        // =============================================

        totalCount: [
          {
            $count: "count",
          },
        ],

        // =============================================
        // ADMIN EARNINGS
        // =============================================

        earnings: [
          {
            $group: {
              _id: null,

              totalEarnings: {
                $sum: {
                  $convert: {
                    input: "$price",

                    to: "double",

                    onError: 0,

                    onNull: 0,
                  },
                },
              },

              totalCoins: {
                $sum: {
                  $convert: {
                    input: "$userCoin",

                    to: "double",

                    onError: 0,

                    onNull: 0,
                  },
                },
              },

              totalBonusCoins: {
                $sum: {
                  $convert: {
                    input: "$bonusCoins",

                    to: "double",

                    onError: 0,

                    onNull: 0,
                  },
                },
              },

              totalPurchases: {
                $sum: 1,
              },
            },
          },
        ],
      },
    });

    // =================================================
    // EXECUTE
    // =================================================

    const result =
      await History.aggregate(
        pipeline
      );

    // =================================================
    // EXTRACT RESULT
    // =================================================

    const resultData =
      result?.[0] || {};

    const records =
      resultData.data || [];

    const total =
      resultData.totalCount?.[0]
        ?.count || 0;

    const earnings =
      resultData.earnings?.[0] || {};

    // =================================================
    // ADMIN EARNINGS
    // =================================================

    const adminEarnings = Number(
      Number(
        earnings.totalEarnings || 0
      ).toFixed(2)
    );

    const totalCoins = Number(
      earnings.totalCoins || 0
    );

    const totalBonusCoins =
      Number(
        earnings.totalBonusCoins || 0
      );

    const totalPurchases =
      Number(
        earnings.totalPurchases || 0
      );

    // =================================================
    // FORMAT DATA
    // =================================================

    const data = records.map(
      (record) => {
        const formatted = {
          ...record,

          _id: record._id
            ? record._id.toString()
            : "",

          userId: record.userId
            ? record.userId.toString()
            : "",

          // ==========================================
          // PRICE
          // ==========================================

          price: Number(
            Number(
              record.price || 0
            ).toFixed(2)
          ),

          // ==========================================
          // COINS
          // ==========================================

          userCoin: Number(
            record.userCoin || 0
          ),

          bonusCoins: Number(
            record.bonusCoins || 0
          ),
        };

        // ============================================
        // USER IMAGE
        // ============================================

        if (
          formatted.user &&
          formatted.user.image
        ) {
          formatted.user.image =
            getMediaUrl(
              formatted.user.image
            );
        } else if (
          formatted.user
        ) {
          formatted.user.image = "";
        }

        // ============================================
        // USER ID
        // ============================================

        if (
          formatted.user &&
          formatted.user._id
        ) {
          formatted.user._id =
            formatted.user._id.toString();
        }

        return formatted;
      }
    );

    // =================================================
    // DEBUG
    // =================================================

    console.log(
      "Total Records:",
      total
    );

    console.log(
      "Returned Records:",
      data.length
    );

    console.log(
      "Total Purchases:",
      totalPurchases
    );

    console.log(
      "Admin Earnings:",
      adminEarnings
    );

    console.log(
      "Total Coins:",
      totalCoins
    );

    console.log(
      "Total Bonus Coins:",
      totalBonusCoins
    );

    console.log(
      "=========================================="
    );

    // =================================================
    // RESPONSE
    // ================================================='

   

    return res.status(200).json({
      status: true,

      message:
        "User coin plan transactions retrieved successfully.",

      // ===============================================
      // SUMMARY
      // ===============================================

      adminEarnings,

      totalPurchases,

      totalCoins,

      totalBonusCoins,

      // ===============================================
      // PAGINATION
      // ===============================================

      total,

      totalPages: Math.ceil(
        total / limit
      ),

      currentPage: page,

      limit,

      hasNextPage:
        page <
        Math.ceil(
          total / limit
        ),

      hasPreviousPage:
        page > 1,


      data,
    });
  } catch (error) {
    console.error(
      "❌ retrieveUserPurchaseRecords Error:",
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