const mongoose = require("mongoose");

const emailCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    sender: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "PAUSED",
        "CANCELLED",
        "FAILED"
      ],
      default: "DRAFT",
      index: true
    },

    totalRecipients: {
      type: Number,
      default: 0
    },

    sent: {
      type: Number,
      default: 0
    },

    delivered: {
      type: Number,
      default: 0
    },

    bounced: {
      type: Number,
      default: 0
    },

    complained: {
      type: Number,
      default: 0
    },

    opened: {
      type: Number,
      default: 0
    },

    clicked: {
      type: Number,
      default: 0
    },

    unsubscribed: {
      type: Number,
      default: 0
    },

    failed: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    startedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    lastProcessedAt: {
      type: Date,
      default: null
    },

    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "EmailCampaign",
  emailCampaignSchema
);