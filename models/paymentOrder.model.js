const mongoose = require("mongoose");

/**
 * Server-created payment order (Razorpay). Bound to ONE user and ONE coin plan at creation time.
 * Coins are credited only by services/coinPurchase.service.js after the payment is verified.
 */
const paymentOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coinPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "CoinPlan", required: true },
    gateway: { type: String, enum: ["razorpay"], default: "razorpay" },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: undefined },
    signatureVerified: { type: Boolean, default: false },

    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },
    coins: { type: Number, required: true },
    bonusCoins: { type: Number, default: 0 },
    totalCoins: { type: Number, required: true },
    price: { type: Number, required: true },

    status: { type: String, enum: ["created", "failed", "credited"], default: "created", index: true },
    failureReason: { type: String, default: "" },
    verifiedVia: { type: String, enum: ["", "client", "webhook", "reconcile"], default: "" },
    creditedAt: { type: Date, default: null },
    historyId: { type: mongoose.Schema.Types.ObjectId, ref: "History", default: null },
  },
  { timestamps: true, versionKey: false }
);

// one payment can only ever belong to one order
paymentOrderSchema.index({ razorpayPaymentId: 1 }, { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: "string" } } });
paymentOrderSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);
