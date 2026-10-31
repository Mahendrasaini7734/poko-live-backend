const mongoose = require("mongoose");
const { STATUS_OF_REPORT } = require("../types/constant");

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Who is reporting
    reporterRole: { type: String, enum: ["user", "host"], required: true }, // Role of reporter

    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Who is being reported
    targetRole: { type: String, enum: ["user", "host"], required: true }, // Role of target

    feedPostId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", default: null }, // set when a feed post is reported
    reason: { type: String, required: true }, // Reason for report
    status: { type: Number, enum: STATUS_OF_REPORT, default: 1 }, // 1=pending, 2=solved

    proceedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reportSchema.index({ createdAt: -1 });
reportSchema.index({ reporterId: 1, reporterRole: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ feedPostId: 1 }, { partialFilterExpression: { feedPostId: { $type: "objectId" } } });

reportSchema.plugin(require("../util/adminDashboardPlugin"), { group: "reports", fields: ["status"] });

module.exports = mongoose.model("Report", reportSchema);
