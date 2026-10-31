const mongoose = require("mongoose");

const liveBroadcastHistorySchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", default: null },
    coins: { type: Number, default: 0 },
    gifts: { type: Number, default: 0 },
    audienceCount: { type: Number, default: 0 },
    liveComments: { type: Number, default: 0 },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    duration: { type: String, default: "00:00:00" },
    // Live-session lifecycle (server side): last proof-of-life from the host app and why/how it ended
    lastHeartbeatAt: { type: Date, default: null },
    endReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveBroadcastHistorySchema.index({ hostId: 1 });
// Daily LIVE Task: today's sessions per host (startTime is an Asia/Kolkata ISO string)
liveBroadcastHistorySchema.index({ hostId: 1, startTime: 1 });
liveBroadcastHistorySchema.index({ createdAt: -1 });
// Daily LIVE Task / reaper: sessions of a host by creation date and open sessions
liveBroadcastHistorySchema.index({ hostId: 1, createdAt: 1 });
liveBroadcastHistorySchema.index({ hostId: 1, endTime: 1 });

module.exports = mongoose.model("LiveBroadcastHistory", liveBroadcastHistorySchema);
