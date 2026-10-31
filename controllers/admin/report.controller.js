const Report = require("../../models/report.model");
const User = require("../../models/user.model");
const { getMediaUrl, getMediaUrls } = require("../../util/media");
const firebase = require("../../util/privateKey");

//Get all user-host reports
exports.getUserHostReports = async (req, res) => {
  try {
    const {
      reporterId,
      reporterRole,
      targetId,
      targetRole,
      status,
      search,
      start = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const page = Math.max(parseInt(start) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(limit) || 20, 1),
      100
    );

    const trimmedSearch = search
      ? String(search).trim()
      : "";

    const matchStage = {};

    if (
      reporterId &&
      mongoose.Types.ObjectId.isValid(reporterId)
    ) {
      matchStage.reporterId =
        new mongoose.Types.ObjectId(reporterId);
    }

    if (
      targetId &&
      mongoose.Types.ObjectId.isValid(targetId)
    ) {
      matchStage.targetId =
        new mongoose.Types.ObjectId(targetId);
    }

    if (
      reporterRole &&
      reporterRole !== "All"
    ) {
      matchStage.reporterRole =
        String(reporterRole).trim().toLowerCase();
    }

    if (
      targetRole &&
      targetRole !== "All"
    ) {
      matchStage.targetRole =
        String(targetRole).trim().toLowerCase();
    }

    if (
      status &&
      status !== "All"
    ) {
      const parsedStatus = parseInt(status);

      if (!Number.isNaN(parsedStatus)) {
        matchStage.status = parsedStatus;
      }
    }

    if (
      startDate &&
      endDate &&
      startDate !== "All" &&
      endDate !== "All"
    ) {
      const from = new Date(startDate);
      const to = new Date(endDate);

      if (
        !Number.isNaN(from.getTime()) &&
        !Number.isNaN(to.getTime())
      ) {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        matchStage.createdAt = {
          $gte: from,
          $lte: to,
        };
      }
    }

    const pipeline = [
      {
        $match: matchStage,
      },

      {
        $lookup: {
          from: "users",
          localField: "reporterId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                uniqueId: 1,
                image: 1,
              },
            },
          ],
          as: "reporterUser",
        },
      },

      {
        $lookup: {
          from: "hosts",
          localField: "reporterId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                uniqueId: 1,
                image: 1,
              },
            },
          ],
          as: "reporterHost",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "targetId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                uniqueId: 1,
                image: 1,
              },
            },
          ],
          as: "targetUser",
        },
      },

      {
        $lookup: {
          from: "hosts",
          localField: "targetId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                uniqueId: 1,
                image: 1,
              },
            },
          ],
          as: "targetHost",
        },
      },

      {
        $addFields: {
          reporterData: {
            $cond: [
              {
                $eq: [
                  "$reporterRole",
                  "host",
                ],
              },
              {
                $arrayElemAt: [
                  "$reporterHost",
                  0,
                ],
              },
              {
                $arrayElemAt: [
                  "$reporterUser",
                  0,
                ],
              },
            ],
          },

          targetData: {
            $cond: [
              {
                $eq: [
                  "$targetRole",
                  "host",
                ],
              },
              {
                $arrayElemAt: [
                  "$targetHost",
                  0,
                ],
              },
              {
                $arrayElemAt: [
                  "$targetUser",
                  0,
                ],
              },
            ],
          },
        },
      },
    ];

    if (trimmedSearch) {
      pipeline.push({
        $match: {
          $or: [
            {
              "reporterData.name": {
                $regex: trimmedSearch,
                $options: "i",
              },
            },
            {
              "reporterData.uniqueId": {
                $regex: trimmedSearch,
                $options: "i",
              },
            },
            {
              "targetData.name": {
                $regex: trimmedSearch,
                $options: "i",
              },
            },
            {
              "targetData.uniqueId": {
                $regex: trimmedSearch,
                $options: "i",
              },
            },
            {
              reason: {
                $regex: trimmedSearch,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    pipeline.push(
      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $facet: {
          data: [
            {
              $skip:
                (page - 1) * pageSize,
            },

            {
              $limit: pageSize,
            },

            {
              $project: {
                _id: 1,

                reporterId: 1,
                reporterRole: 1,

                targetId: 1,
                targetRole: 1,

                reason: 1,
                status: 1,

                createdAt: 1,
                updatedAt: 1,

                reporterName: {
                  $ifNull: [
                    "$reporterData.name",
                    "",
                  ],
                },

                reporterUniqueId: {
                  $ifNull: [
                    "$reporterData.uniqueId",
                    "",
                  ],
                },

                reporterImage: {
                  $ifNull: [
                    "$reporterData.image",
                    "",
                  ],
                },

                targetName: {
                  $ifNull: [
                    "$targetData.name",
                    "",
                  ],
                },

                targetUniqueId: {
                  $ifNull: [
                    "$targetData.uniqueId",
                    "",
                  ],
                },

                targetImage: {
                  $ifNull: [
                    "$targetData.image",
                    "",
                  ],
                },
              },
            },
          ],

          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      }
    );

    const result =
      await Report.aggregate(pipeline);

    const total =
      result?.[0]?.totalCount?.[0]?.count || 0;

    const reports = (
      result?.[0]?.data || []
    ).map((report) => ({
      ...report,

      reporterImage: getMediaUrl(
        report.reporterImage
      ),

      targetImage: getMediaUrl(
        report.targetImage
      ),

    }));

    console.log("HOST",reports);

    return res.status(200).json({
      status: true,
      message: "Reports retrieved successfully.",
      total,
      totalPages: Math.ceil(
        total / pageSize
      ),
      currentPage: page,
      limit: pageSize,
      data: reports,
    });
  } catch (error) {
    console.error(
      "❌ getUserHostReports Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

//Solve a report
exports.solveUserHostReport = async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) {
      return res.status(400).json({ status: false, message: "reportId is required." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(400).json({ status: false, message: "Report not found." });
    }

    if (report.status === 2) {
      return res.status(200).json({ status: false, message: "Report is already solved." });
    }

    report.status = 2;
    report.proceedAt = new Date();
    await report.save();

    res.status(200).json({
      status: true,
      message: "Report marked as solved.",
      data: report,
    });

    if (report.reporterId) {
      const reporter = await User.findById(report.reporterId).lean().select("fcmToken name");
      if (reporter?.fcmToken !== null) {
        const payload = {
          token: reporter?.fcmToken,
          data: {
            title: "Your report has been solved",
            body: `Hi ${reporter.name}, the report you submitted has been resolved.`,
            type: "REPORT_SOLVED",
          },
        };


        firebase
          .messaging
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response solveUserHostReport: ", response);
          })
          .catch((error) => {
            console.error("Error sending FCM message:", error);
          });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};

//Delete a report
exports.deleteUserHostReport = async (req, res) => {
  try {
    const { reportId } = req.query || {};
    if (!reportId) {
      return res.status(400).json({ status: false, message: "reportId is required." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(400).json({ status: false, message: "Report not found." });
    }

    await report.deleteOne();

    return res.status(200).json({ status: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};

