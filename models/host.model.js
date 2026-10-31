const mongoose = require("mongoose");
const { HOST_REQUEST_STATUS } = require("../types/constant");

// 🔹 reusable S3 file schema
const s3FileSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    key: { type: String, default: "" },
  },
  { _id: false }
);


const hostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null },

    name: { type: String, default: "" },
    gender: { type: String, default: "" },
    bio: { type: String, default: "" },
    age: { type: Number, default: 18 },
    dob: { type: String, default: "" },
    email: { type: String, default: "" },

    countryFlagImage: { type: String, default: "" },
    country: { type: String, trim: true, lowercase: true, default: "" },

    images_option: { type: String, default: "" },

    impression: { type: Array, default: [] },
    language: { type: Array, default: ["Hindi", "English"] },

    identityProofType: { type: String, default: "" },

    // ================= S3 FILES =================
    // 🔥 S3 FIELDS
    image: {
      type: s3FileSchema,
      default: () => ({ url: "", key: "" }),
    },
    photoGallery: { type: [s3FileSchema], default: [] },
    video: { type: [s3FileSchema], default: [] },
    liveVideo: { type: [s3FileSchema], default: [] },
    profileVideo: { type: [s3FileSchema], default: [] },
    identityProof: { type: [s3FileSchema], default: [] },
    // ============================================

    ipAddress: { type: String, default: "" },
    identity: { type: String, default: "" },
    fcmToken: { type: String, default: null },

    uniqueId: { type: String, unique: true, default: "" },

    status: { type: Number, enum: HOST_REQUEST_STATUS, default: 1 },
    reason: { type: String, default: "" },

    // ================= CALL RATES =================
    randomCallRate: { type: Number, default: 0 },
    randomCallFemaleRate: { type: Number, default: 0 },
    randomCallMaleRate: { type: Number, default: 0 },
    privateCallRate: { type: Number, default: 0 },
    audioCallRate: { type: Number, default: 0 },
    chatRate: { type: Number, default: 0 },
    // ==============================================

    coin: { type: Number, default: 0 },
    totalGifts: { type: Number, default: 0 },
    beans: {
      type: Number,
      default: 0
    },
      userCoins: {
      type: Number,
      default: 0
    },

    redeemedCoins: { type: Number, default: 0 },
    redeemedAmount: { type: Number, default: 0 },

    isBlock: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },

    isOnline: { type: Boolean, default: false },
  // authoritative UTC timestamp of the last authenticated presence/activity (see user.model.js)
  lastActiveAt: { type: Date, default: null },
    isBusy: { type: Boolean, default: false },

    callId: { type: String, default: null },

    isLive: { type: Boolean, default: false },
    liveHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveBroadcastHistory",
      default: null,
    },

    agoraUid: { type: Number, default: 0 },
    channel: { type: String, default: "" },
    token: { type: String, default: "" },
    mobileNumber: {
      type: String,
      default: "",
    },

    countryCode: {
      type: String,
      default: "",
    },

    date: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ================= INDEXES =================
hostSchema.index({
  isOnline: 1,
  isBusy: 1,
  isFake: 1,
  isLive: 1,
  isBlock: 1,
  callId: 1,
});
hostSchema.index({ isFake: 1 });
// Daily LIVE Task scheduler: only currently LIVE hosts
hostSchema.index({ isLive: 1 }, { partialFilterExpression: { isLive: true } });
hostSchema.index({ createdAt: -1 });
hostSchema.index({ lastActiveAt: -1 });
hostSchema.index({ status: 1, isFake: 1, isOnline: 1 });

// realtime Live Analytics hook (observe-only, see util/liveAnalyticsPlugin.js)
hostSchema.plugin(require("../util/liveAnalyticsPlugin"), { kind: "host" });

// admin dashboard change notifications (observe-only)
hostSchema.plugin(require("../util/adminDashboardPlugin"), { group: "hosts", fields: ["status", "isBlock", "isLive", "agencyId"] });

module.exports = mongoose.model("Host", hostSchema);
