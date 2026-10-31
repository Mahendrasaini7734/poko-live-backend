const mongoose = require("mongoose");

/**
 * LiveComment - comments written in a live room, kept for the Admin Live Command Center.
 * Written ONLY by services/liveAnalytics.service.js (fire & forget, never blocks the live flow).
 * Auto-deleted after 30 days (TTL) so the collection can never grow without limit.
 */
const liveCommentSchema = new mongoose.Schema(
  {
    // same id the realtime feed uses -> admin never shows a comment twice
    feedId: { type: String, required: true },
    // LiveBroadcastHistory _id (the "room id" used everywhere in the admin panel)
    roomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: String, default: "" },
    // numeric app id of the sender (User.uniqueId) - same id shown in participants / gifts
    uniqueId: { type: String, default: "" },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    text: { type: String, default: "" },
    // true when the HOST wrote it (replayed to viewers that join later)
    isHostMessage: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

liveCommentSchema.index({ roomId: 1, createdAt: -1 });
liveCommentSchema.index({ feedId: 1 }, { unique: true });
liveCommentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("LiveComment", liveCommentSchema);
