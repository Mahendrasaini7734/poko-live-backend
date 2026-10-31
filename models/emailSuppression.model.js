const mongoose = require("mongoose");

const emailSuppressionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    reason: {
      type: String,
      enum: [
        "BOUNCE",
        "COMPLAINT",
        "UNSUBSCRIBED"
      ],
      required: true
    },

    source: {
      type: String,
      enum: [
        "SES",
        "USER",
        "ADMIN",
        "SYSTEM"
      ],
      default: "SYSTEM"
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailCampaign",
      default: null
    },

    suppressedAt: {
      type: Date,
      default: Date.now
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "EmailSuppression",
  emailSuppressionSchema
);