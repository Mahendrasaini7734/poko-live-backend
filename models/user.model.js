const { LOGIN_TYPE } = require("../types/constant");

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    selfIntro: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    bio: { type: String, default: "" },
    age: { type: Number, default: 18 },
    image: { type: String, default: "" },
    email: { type: String, default: "" },

    countryFlagImage: { type: String, default: "" },
    country: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    countryCode: {
      type: String,
      trim: true,
      default: "",
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    fullPhoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    ipAddress: { type: String, default: "" },

    loginType: {
      type: Number,
      enum: LOGIN_TYPE,
    },

    identity: {
      type: String,
      default: "",
    },

    fcmToken: {
      type: String,
      default: null,
    },

    uniqueId: {
      type: String,
      unique: true,
      default: "",
    },

    firebaseUid: {
      type: String,
      unique: true,
      default: "",
    },

    provider: {
      type: String,
      default: "",
    },

    coin: {
      type: Number,
      default: 0,
    },

    spentCoins: {
      type: Number,
      default: 0,
    },

    rechargedCoins: {
      type: Number,
      default: 0,
    },

    isVip: {
      type: Boolean,
      default: false,
    },

    vipPlanStartDate: {
      type: String,
      default: null,
    },

    vipPlanEndDate: {
      type: String,
      default: null,
    },

    vipPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VipPlan",
      default: null,
    },

    vipPlan: {
      validity: {
        type: Number,
        default: 0,
      },
      validityType: {
        type: String,
        default: "",
      },
      coin: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        default: 0,
      },
    },

    isBlock: {
      type: Boolean,
      default: false,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    isBusy: {
      type: Boolean,
      default: false,
    },

    callId: {
      type: String,
      default: null,
    },

    isHost: {
      type: Boolean,
      default: false,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null,
    },

    lastlogin: {
      type: String,
      default: "",
    },

    // authoritative UTC timestamp of the last authenticated presence/activity (socket connect / disconnect / throttled heartbeat).
    // NOT the same as `lastlogin` (set only on a successful login).
    lastActiveAt: {
      type: Date,
      default: null,
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

userSchema.index({ identity: 1, loginType: 1 });
userSchema.index({ isBlock: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ fullPhoneNumber: 1 });

// realtime Live Analytics hook (observe-only, see util/liveAnalyticsPlugin.js)
userSchema.plugin(require("../util/liveAnalyticsPlugin"), { kind: "user" });

// admin dashboard change notifications (observe-only)
userSchema.plugin(require("../util/adminDashboardPlugin"), { group: "users", fields: ["isBlock", "isVip", "isHost"] });

module.exports = mongoose.model("User", userSchema);