const mongoose = require("mongoose");

const promotionalBannerSchema = new mongoose.Schema(
  {
    bannerType: {
      type: String,
      default: "promotional",
      trim: true,
    },
    bannerUrl: {
      type: String,
      default: "",
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
       phone: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  "PromotionalBanner",
  promotionalBannerSchema
);