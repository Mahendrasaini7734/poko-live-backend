const mongoose = require("mongoose");

/**
 * LiveSession - analytics history written ONLY by services/liveAnalytics.service.js.
 * One row = one host live session OR one viewer's stay in a live room.
 * (LiveBroadcastView rows are deleted when a viewer leaves, so this is the
 *  only place where viewer history is kept.)
 */
const liveSessionSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ["broadcast", "room"], required: true },
    // LiveBroadcastHistory _id (broadcast) OR Room _id (room)
    roomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", default: null },
    // User _id (viewer) or the host's own User _id
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
    role: { type: String, enum: ["host", "viewer"], required: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
    // seconds
    duration: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

liveSessionSchema.index({ leftAt: 1 });
liveSessionSchema.index({ roomId: 1, role: 1 });
liveSessionSchema.index({ userId: 1, joinedAt: -1 });
liveSessionSchema.index({ hostId: 1, role: 1, joinedAt: -1 });
liveSessionSchema.index({ joinedAt: -1 });

module.exports = mongoose.model("LiveSession", liveSessionSchema);
