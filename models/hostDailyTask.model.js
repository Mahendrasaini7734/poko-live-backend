const mongoose = require("mongoose");

const hostDailyTaskSchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
    taskDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // Asia/Kolkata day
    taskType: { type: String, default: "LIVE_TIME" },

    targetMinutes: { type: Number, default: 60 },
    rewardCoins: { type: Number, default: 1000 },

    completedMinutes: { type: Number, default: 0 },
    remainingMinutes: { type: Number, default: 60 },
    progressPercentage: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },

    rewardClaimed: { type: Boolean, default: false },
    rewardClaimedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

hostDailyTaskSchema.index({ hostId: 1, taskDate: 1, taskType: 1 }, { unique: true });
hostDailyTaskSchema.index({ hostId: 1, taskDate: 1 });
hostDailyTaskSchema.index({ taskDate: 1 });
hostDailyTaskSchema.index({ status: 1 });

module.exports = mongoose.model("HostDailyTask", hostDailyTaskSchema);
