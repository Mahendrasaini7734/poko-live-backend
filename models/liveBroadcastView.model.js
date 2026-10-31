const mongoose = require("mongoose");

const liveBroadcastViewSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    gender: { type: String, default: "" },
    image: { type: String, default: "" },
    countryFlagImage: { type: String, default: "" },
    country: { type: String, trim: true, lowercase: true, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveBroadcastHistory", default: null },
    // socket that currently represents this viewer (a reconnect replaces it; a stale socket's
    // disconnect must not remove the viewer again)
    socketId: { type: String, default: null },
    lastSeenAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveBroadcastViewSchema.index({ userId: 1 });
liveBroadcastViewSchema.index({ liveHistoryId: 1 });
liveBroadcastViewSchema.index({ socketId: 1 });
// one row per viewer per live (no double counting on rapid re-joins)
liveBroadcastViewSchema.index(
  { liveHistoryId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { liveHistoryId: { $type: "objectId" }, userId: { $type: "objectId" } } }
);

// realtime Live Analytics hook (observe-only, see util/liveAnalyticsPlugin.js)
liveBroadcastViewSchema.plugin(require("../util/liveAnalyticsPlugin"), { kind: "live" });

module.exports = mongoose.model("LiveBroadcastView", liveBroadcastViewSchema);
