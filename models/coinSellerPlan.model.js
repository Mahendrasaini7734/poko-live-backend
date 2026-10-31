const mongoose = require("mongoose");

const coinSellerPlanSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinSeller",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    coins: {
      type: Number,
      required: true,
      min: 1,
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

coinSellerPlanSchema.index({
  sellerId: 1,
  isActive: 1,
  sortOrder: 1,
});

module.exports = mongoose.model(
  "CoinSellerPlan",
  coinSellerPlanSchema
);