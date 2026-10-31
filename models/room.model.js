const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },

    inviteCode: {
      type: String,
      default: null,
      index: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "live", "ended"],
      default: "created",
      index: true,
    },

    seatLimit: {
      type: Number,
      default: 10,
      min: 1,
      max: 20,
    },

    totalParticipants: {
      type: Number,
      default: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({
  name: "text",
  description: "text",
});

roomSchema.index({
  status: 1,
  type: 1,
});

roomSchema.index({
  hostId: 1,
  status: 1,
});

roomSchema.index({
  createdBy: 1,
});

// realtime Live Analytics hook (observe-only, see util/liveAnalyticsPlugin.js)
roomSchema.plugin(require("../util/liveAnalyticsPlugin"), { kind: "live" });

module.exports = mongoose.model("Room", roomSchema);