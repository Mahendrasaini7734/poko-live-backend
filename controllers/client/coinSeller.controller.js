const mongoose = require("mongoose");
const CoinSeller = require("../../models/coinSeller.model");
const CoinSellerPlan = require("../../models/coinSellerPlan.model");
exports.retrieveCoinSellers = async (req, res) => {
  try {
    const sellers = await CoinSeller.find({
      isActive: true,
    })
      .select(
        "_id name image uniqueId country countryFlagImage state city mobileNumber whatsappNumber isOnline isActive isVerified hasFrauds fraudCount totalAvailableCoins totalPurchasedCoins totalSoldCoins totalOrders minPurchase maxPurchase rating responseTime sortOrder"
      )
      .sort({
        sortOrder: 1,
        isOnline: -1,
        isVerified: -1,
        rating: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Coin sellers retrieved successfully.",
      data: sellers,
    });
  } catch (error) {
    console.error(
      "RETRIEVE COIN SELLERS ERROR =>",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

exports.retrieveCoinSellerPlans = async (req, res) => {
  try {
    const { sellerUniqueId } = req.params;

    console.log(
      "RETRIEVE COIN SELLER PLANS => sellerUniqueId:",
      sellerUniqueId
    );

    if (!sellerUniqueId) {
      return res.status(200).json({
        status: false,
        message: "Valid sellerUniqueId is required.",
      });
    }

    const seller = await CoinSeller.findOne({
      uniqueId: sellerUniqueId,
      isActive: true,
    })
      .select(
        "_id name image uniqueId country countryFlagImage state city mobileNumber whatsappNumber isOnline isActive isVerified hasFrauds fraudCount totalAvailableCoins totalPurchasedCoins totalSoldCoins totalOrders minPurchase maxPurchase rating responseTime sortOrder"
      )
      .lean();

    if (!seller) {
      return res.status(200).json({
        status: false,
        message: "Coin seller not found.",
      });
    }

    const plans = await CoinSellerPlan.find({
      sellerId: seller._id,
      isActive: true,
    })
      .select(
        "_id sellerId amount coins sortOrder"
      )
      .sort({
        sortOrder: 1,
        amount: 1,
      })
      .lean();

    return res.status(200).json({
      status: true,
      message: "Coin seller plans retrieved successfully.",
      data: {
        seller,
        plans,
      },
    });
  } catch (error) {
    console.error(
      "RETRIEVE COIN SELLER PLANS ERROR =>",
      error
    );

    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};