const mongoose = require("mongoose");

// Idempotency + audit record: exactly one document per host/day/task.
const hostDailyTaskRewardSchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
    taskDate: { type: String, required: true },
    taskType: { type: String, required: true },
    rewardCoins: { type: Number, required: true },
    status: { type: String, enum: ["credited"], default: "credited" },
    creditedAt: { type: Date, default: Date.now },
    historyId: { type: mongoose.Schema.Types.ObjectId, ref: "History", default: null },
  },
  { timestamps: true, versionKey: false }
);

hostDailyTaskRewardSchema.index({ hostId: 1, taskDate: 1, taskType: 1 }, { unique: true });
hostDailyTaskRewardSchema.index({ hostId: 1, creditedAt: -1 });

module.exports = mongoose.model("HostDailyTaskReward", hostDailyTaskRewardSchema);
