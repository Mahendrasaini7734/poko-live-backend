const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["host", "speaker", "audience"],
      default: "audience",
      index: true,
    },

    seatIndex: {
      type: Number,
      default: null,
      min: 0,
      max: 20,
    },

    requestedSeatIndex: {
      type: Number,
      default: null,
      min: 0,
      max: 20,
      index: true,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    micEnabled: {
      type: Boolean,
      default: true,
    },

    isHandRaised: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    socketId: {
      type: String,
      default: null,
    },

    agoraUid: {
      type: Number,
      required: true,
      unique: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

participantSchema.index(
  {
    roomId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

participantSchema.index({
  roomId: 1,
  role: 1,
});

participantSchema.index({
  roomId: 1,
  isActive: 1,
});

participantSchema.index({
  roomId: 1,
  seatIndex: 1,
});

participantSchema.index({
  roomId: 1,
  isHandRaised: 1,
});

participantSchema.index({
  roomId: 1,
  requestedSeatIndex: 1,
});

participantSchema.index({
  socketId: 1,
});

// realtime Live Analytics hook (observe-only, see util/liveAnalyticsPlugin.js)
participantSchema.plugin(require("../util/liveAnalyticsPlugin"), { kind: "live" });

module.exports = mongoose.model(
  "Participant",
  participantSchema
);
