const mongoose = require("mongoose");

const coinSellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    uniqueId: {
      type: String,
      default: "",
      trim: true,
      unique: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    countryFlagImage: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    whatsappNumber: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    hasFrauds: {
      type: Boolean,
      default: false,
    },
    fraudCount: {
      type: Number,
      default: 0,
    },
    totalAvailableCoins: {
      type: Number,
      default: 0,
    },
    totalPurchasedCoins: {
      type: Number,
      default: 0,
    },
    totalSoldCoins: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxPurchase: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
    },
    responseTime: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CoinSeller",
  coinSellerSchema
);