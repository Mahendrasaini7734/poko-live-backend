const mongoose = require("mongoose");

const emailCampaignRecipientSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailCampaign",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "SENDING",
        "SENT",
        "DELIVERED",
        "BOUNCED",
        "COMPLAINT",
        "OPENED",
        "CLICKED",
        "UNSUBSCRIBED",
        "FAILED"
      ],
      default: "PENDING",
      index: true
    },

    messageId: {
      type: String,
      default: null,
      index: true
    },

    sentAt: {
      type: Date,
      default: null
    },

    deliveredAt: {
      type: Date,
      default: null
    },

    bouncedAt: {
      type: Date,
      default: null
    },

    complainedAt: {
      type: Date,
      default: null
    },

    openedAt: {
      type: Date,
      default: null
    },

    clickedAt: {
      type: Date,
      default: null
    },

    unsubscribedAt: {
      type: Date,
      default: null
    },

    failedAt: {
      type: Date,
      default: null
    },

    errorMessage: {
      type: String,
      default: null
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

emailCampaignRecipientSchema.index({
  campaignId: 1,
  status: 1
});

emailCampaignRecipientSchema.index({
  campaignId: 1,
  email: 1
});

module.exports = mongoose.model(
  "EmailCampaignRecipient",
  emailCampaignRecipientSchema
);