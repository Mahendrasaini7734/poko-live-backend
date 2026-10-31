const mongoose = require("mongoose");

/**
 * Audit trail of live-room actions: admin actions from the Live Command Center AND host room
 * lifecycle (START_ROOM / END_ROOM).
 * Written by services/liveAnalytics.service.js only.
 */
const liveAdminAuditSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    adminEmail: { type: String, default: "" },
    // WHO did it. Admin actions keep adminId/adminEmail; host / system actions use these.
    actorType: { type: String, enum: ["admin", "host", "system"], default: "admin" },
    actorId: { type: String, default: "" },
    actorName: { type: String, default: "" },
    reason: { type: String, default: "" },
    // idempotency key (e.g. "END_ROOM:<roomId>") -> the same lifecycle action is never logged twice
    dedupeKey: { type: String, default: undefined },
    action: { type: String, required: true }, // START_ROOM | END_ROOM | ...
    targetType: { type: String, default: "" }, // room | host | user
    targetId: { type: String, default: "" },
    roomId: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

liveAdminAuditSchema.index({ createdAt: -1 });
liveAdminAuditSchema.index({ adminId: 1, createdAt: -1 });
liveAdminAuditSchema.index({ roomId: 1, createdAt: -1 });
liveAdminAuditSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } });

module.exports = mongoose.model("LiveAdminAudit", liveAdminAuditSchema);
