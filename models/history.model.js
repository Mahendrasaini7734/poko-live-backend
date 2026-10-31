const { HISTORY_TYPE, WITHDRAWAL_STATUS } = require("../types/constant");

const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      trim: true,
      default: "",
    },

    type: {
      type: Number,
      enum: HISTORY_TYPE,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null,
    },

    giftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gift",
      default: null,
    },

    // live room (LiveBroadcastHistory _id) the gift was sent in - used by Live Analytics
    liveHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveBroadcastHistory",
      default: null,
    },

    // feed post the gift was sent on (admin Feed Management). null for live/call/chat gifts
    feedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedPost",
      default: null,
    },
    // client generated id of ONE gift tap: the same request can never be charged twice
    giftRequestId: {
      type: String,
      default: null,
    },

    giftCount: {
      type: Number,
      default: 0,
    },

    giftCoin: {
      type: Number,
      default: 0,
    },

    giftType: {
      type: Number,
      default: 0,
    },

    giftImage: {
      type: String,
      default: "",
    },

    giftsvgaImage: {
      type: String,
      default: "",
    },

    callType: {
      type: String,
      default: "",
    },

    isRandom: {
      type: Boolean,
      default: false,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    callConnect: {
      type: Boolean,
      default: false,
    },

    callStartTime: {
      type: String,
      default: "",
    },

    callEndTime: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "00:00:00",
    },

    userCoin: {
      type: Number,
      default: 0,
    },

    hostCoin: {
      type: Number,
      default: 0,
    },

    adminCoin: {
      type: Number,
      default: 0,
    },

    agencyCoin: {
      type: Number,
      default: 0,
    },

    bonusCoins: {
      type: Number,
      default: 0,
    },

    validity: {
      type: Number,
      default: 0,
    },

    validityType: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      default: 0,
    },

    payoutStatus: {
      type: Number,
      default: 0,
      enum: WITHDRAWAL_STATUS,
    },

    reason: {
      type: String,
      default: "",
    },

    paymentGateway: {
      type: String,
      default: "",
    },

    coinPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinPlan",
      default: null,
    },

    productId: {
      type: String,
      trim: true,
      default: "",
    },

   purchaseToken: {
  type: String,
  trim: true,
  default: undefined,
},

    purchaseId: {
      type: String,
      trim: true,
      default: "",
    },

    googleOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    googlePurchaseState: {
      type: String,
      default: "",
    },

    googleConsumptionState: {
      type: String,
      default: "",
    },

    googleAcknowledgementState: {
      type: String,
      default: "",
    },

    googlePurchaseTimeMillis: {
      type: String,
      default: "",
    },

    razorpayOrderId: { type: String, trim: true, default: undefined },
    razorpayPaymentId: { type: String, trim: true, default: undefined },

    googleConsumeStatus: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed",
      ],
      default: "pending",
    },

    date: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

historySchema.index({ type: 1 });
historySchema.index({ agencyId: 1 });
historySchema.index({ hostId: 1 });
historySchema.index({ userId: 1 });
historySchema.index({ giftId: 1 });
historySchema.index({ createdAt: -1 });
historySchema.index({ liveHistoryId: 1, type: 1 });
historySchema.index({ type: 1, createdAt: -1 });

historySchema.index(
  { purchaseToken: 1 },
  {
    unique: true,
    sparse: true,
  }
);

// a Razorpay payment / order can be credited only once
historySchema.index({ razorpayPaymentId: 1 }, { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: "string" } } });
historySchema.index({ razorpayOrderId: 1 }, { unique: true, partialFilterExpression: { razorpayOrderId: { $type: "string" } } });

// duplicate-gift guard (authoritative): one charge per (sender, giftRequestId)
historySchema.index(
  { userId: 1, giftRequestId: 1 },
  { unique: true, partialFilterExpression: { giftRequestId: { $type: "string" } } }
);
historySchema.index({ feedPostId: 1, type: 1 }, { partialFilterExpression: { feedPostId: { $type: "objectId" } } });
historySchema.index({ hostId: 1, type: 1, createdAt: -1 });
historySchema.plugin(require("../util/adminDashboardPlugin"), { group: "transactions", insertOnly: true });

module.exports = mongoose.model(
  "History",
  historySchema
);