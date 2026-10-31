const Report = require("../../models/report.model");
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const firebase = require("../../util/privateKey");
const mongoose = require("mongoose");

// Submit a report (user → host or host → user)
exports.submitReport = async (req, res) => {
  try {
    const {
      reporterId,
      reporterRole,
      targetId,
      targetRole,
      reason,
    } = req.body;

    if (
      !reporterId ||
      !reporterRole ||
      !targetId ||
      !targetRole ||
      !reason
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const normalizedReporterRole = String(
      reporterRole
    )
      .trim()
      .toLowerCase();

    const normalizedTargetRole = String(
      targetRole
    )
      .trim()
      .toLowerCase();

    const validRoles = ["user", "host"];

    if (
      !validRoles.includes(normalizedReporterRole) ||
      !validRoles.includes(normalizedTargetRole)
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid reporterRole or targetRole. Allowed roles are user and host.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(reporterId) ||
      !mongoose.Types.ObjectId.isValid(targetId)
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid reporterId or targetId.",
      });
    }

    const resolveEntity = async (id, role) => {
      const objectId = new mongoose.Types.ObjectId(id);

      if (role === "host") {
        let host = await Host.findById(objectId)
          .select(
            "_id userId isBlock fcmToken name uniqueId image"
          )
          .lean();

        if (host) {
          return host;
        }

        host = await Host.findOne({
          userId: objectId,
        })
          .select(
            "_id userId isBlock fcmToken name uniqueId image"
          )
          .lean();

        return host;
      }

      return User.findById(objectId)
        .select(
          "_id isBlock fcmToken name uniqueId image"
        )
        .lean();
    };

    const [reporter, target] =
      await Promise.all([
        resolveEntity(
          reporterId,
          normalizedReporterRole
        ),

        resolveEntity(
          targetId,
          normalizedTargetRole
        ),
      ]);

    if (!reporter) {
      return res.status(404).json({
        status: false,
        message:
          normalizedReporterRole === "host"
            ? "Reporter host not found."
            : "Reporter user not found.",
      });
    }

    if (reporter.isBlock) {
      return res.status(403).json({
        status: false,
        message:
          "You are blocked by admin.",
      });
    }

    if (!target) {
      return res.status(404).json({
        status: false,
        message:
          normalizedTargetRole === "host"
            ? "Target host not found."
            : "Target user not found.",
      });
    }

    if (target.isBlock) {
      return res.status(403).json({
        status: false,
        message:
          "Target is blocked by admin.",
      });
    }

    if (
      reporter._id.toString() ===
        target._id.toString() &&
      normalizedReporterRole ===
        normalizedTargetRole
    ) {
      return res.status(400).json({
        status: false,
        message:
          "You cannot report yourself.",
      });
    }

    const existingReport =
      await Report.findOne({
        reporterId: reporter._id,
        reporterRole:
          normalizedReporterRole,

        targetId: target._id,
        targetRole:
          normalizedTargetRole,

        status: 1,
      }).lean();

    if (existingReport) {
      return res.status(200).json({
        status: false,
        message:
          "A report has already been submitted.",
      });
    }

    const newReport = new Report({
      reporterId: reporter._id,
      reporterRole:
        normalizedReporterRole,

      targetId: target._id,
      targetRole:
        normalizedTargetRole,

      reason: String(reason).trim(),

      status: 1,
    });

    await newReport.save();

    if (
      reporter.fcmToken &&
      typeof reporter.fcmToken === "string"
    ) {
      const payload = {
        token: reporter.fcmToken,
        data: {
          title: "🚨 Report Submitted",
          body:
            "Your report has been successfully submitted and is under review.",
          type: "REPORT_SUBMISSION",
          reportId:
            newReport._id.toString(),
          reporterRole:
            normalizedReporterRole,
          targetRole:
            normalizedTargetRole,
        },
      };

      try {
        await firebase.messaging.send(
          payload
        );

        console.log(
          "✅ Report submission notification sent."
        );
      } catch (fcmError) {
        console.error(
          "❌ Report FCM Error:",
          fcmError.message
        );
      }
    }

    console.log(
      "========== REPORT CREATED =========="
    );

    console.log(
      "Reporter ID:",
      reporter._id.toString()
    );

    console.log(
      "Reporter Role:",
      normalizedReporterRole
    );

    console.log(
      "Reporter Name:",
      reporter.name
    );

    console.log(
      "Target ID:",
      target._id.toString()
    );

    console.log(
      "Target Role:",
      normalizedTargetRole
    );

    console.log(
      "Target Name:",
      target.name
    );

    console.log(
      "Reason:",
      String(reason).trim()
    );

    return res.status(200).json({
      status: true,
      message:
        "Report submitted successfully.",
      data: newReport,
    });
  } catch (error) {
    console.error(
      "❌ submitReport Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error.",
    });
  }
};
