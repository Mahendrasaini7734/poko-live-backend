const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null,
    },

    targetHostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null,
    },

    blockedBy: {
      type: String,
      enum: ["user", "host"],
      required: true,
    },

    blockedType: {
      type: String,
      enum: ["user", "host"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

blockSchema.index({
  hostId: 1,
  userId: 1,
  blockedBy: 1,
  blockedType: 1,
});

blockSchema.index({
  hostId: 1,
  targetHostId: 1,
  blockedBy: 1,
  blockedType: 1,
});

module.exports = mongoose.model("Block", blockSchema);
