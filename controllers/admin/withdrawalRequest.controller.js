const WithdrawalRequest = require("../../models/withdrawalRequest.model");

//import model
const History = require("../../models/history.model");
const Agency = require("../../models/agency.model");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("mongoose");

//get withdrawal requests ( hosts / agency )
const {
  getMediaUrl
} = require("../../util/media");

// get withdrawal requests (hosts / agency)
exports.retrievePayoutRequests = async (req, res) => {
  try {
    const { status, person } = req.query;

    if (!status || !person) {
      return res.status(200).json({
        status: false,
        message: "Invalid query parameters.",
      });
    }

    const start = Math.max(
      parseInt(req.query.start) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 20,
        1
      ),
      100
    );

    const startDate =
      req.query.startDate || "All";

    const endDate =
      req.query.endDate || "All";

    // ==========================================
    // DATE FILTER
    // ==========================================

    let dateFilterQuery = {};

    if (
      startDate !== "All" &&
      endDate !== "All"
    ) {
      const formattedStartDate =
        new Date(startDate);

      const formattedEndDate =
        new Date(endDate);

      if (
        !Number.isNaN(
          formattedStartDate.getTime()
        ) &&
        !Number.isNaN(
          formattedEndDate.getTime()
        )
      ) {
        formattedStartDate.setHours(
          0,
          0,
          0,
          0
        );

        formattedEndDate.setHours(
          23,
          59,
          59,
          999
        );

        dateFilterQuery = {
          createdAt: {
            $gte: formattedStartDate,
            $lte: formattedEndDate,
          },
        };
      }
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================

    let statusQuery = {};

    if (status !== "All") {
      const statusValue = parseInt(status);

      if (!Number.isNaN(statusValue)) {
        statusQuery.status = statusValue;
      }
    }

    // ==========================================
    // PERSON FILTER
    // ==========================================

    let personQuery = {};

    if (person !== "All") {
      const personValue =
        parseInt(person);

      if (!Number.isNaN(personValue)) {
        personQuery.person = personValue;

        // Agency
        if (personValue === 1) {
          personQuery.agencyId = {
            $ne: null,
          };
        }

        // Host
        if (personValue === 2) {
          personQuery.hostId = {
            $ne: null,
          };
        }
      }
    }

    const query = {
      ...personQuery,
      ...statusQuery,
      ...dateFilterQuery,
    };

    // ==========================================
    // FETCH DATA
    // ==========================================

    const [
      totalRecords,
      records,
    ] = await Promise.all([
      WithdrawalRequest.countDocuments(
        query
      ),

      WithdrawalRequest.find(query)
        .populate(
          "agencyId",
          "uniqueId name image"
        )
        .populate(
          "hostId",
          "uniqueId name image"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (start - 1) * limit
        )
        .limit(limit)
        .lean(),
    ]);

    // ==========================================
    // FORMAT S3 IMAGES
    // ==========================================

    const data = records.map(
      (record) => {
        // Agency image
        if (
          record.agencyId &&
          record.agencyId.image
        ) {
          record.agencyId.image =
            getMediaUrl(
              record.agencyId.image
            );
        }

        // Host image
        if (
          record.hostId &&
          record.hostId.image
        ) {
          record.hostId.image =
            getMediaUrl(
              record.hostId.image
            );
        }

        return record;
      }
    );

    return res.status(200).json({
      status: true,
      message:
        "Withdrawal requests retrieved successfully.",

      total: totalRecords,

      totalPages: Math.ceil(
        totalRecords / limit
      ),

      currentPage: start,

      limit,

      data,
    });
  } catch (error) {
    console.error(
      "❌ retrievePayoutRequests Error:",
      error
    );

    return res.status(500).json({
      status: false,
      error:
        error.message ||
        "Internal Server Error",
    });
  }
};

//accept or decline withdrawal requests ( agency )
exports.updateAgencyWithdrawalStatus = async (req, res) => {
  try {
    const { requestId, agencyId, type, reason } = req.query;

    if (!requestId || !agencyId || !type) {
      return res.status(200).json({ status: false, message: "Missing required parameters." });
    }

    const actionType = type.trim().toLowerCase();
    const dateNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const [request, agency] = await Promise.all([
      WithdrawalRequest.findById(requestId).lean().select("_id agencyId coin amount status uniqueId"),
      Agency.findById(agencyId).lean().select("_id isBlock fcmToken"),
    ]);

    if (!request) return res.status(200).json({ status: false, message: "Withdrawal request not found." });
    if (!agency) return res.status(200).json({ status: false, message: "Agency not found." });
    if (agency.isBlock) return res.status(403).json({ status: false, message: "Agency is blocked by admin." });

    if (request.status === 2) return res.status(200).json({ status: false, message: "Request already approved." });
    if (request.status === 3) return res.status(200).json({ status: false, message: "Request already declined." });

    if (actionType === "approve") {
      res.status(200).json({
        status: true,
        message: "Withdrawal request approved successfully.",
      });

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: request._id, person: 1, agencyId: agencyId },
          {
            $set: {
              status: 2,
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: request.uniqueId, type: 5 },
          {
            $set: {
              payoutStatus: 2,
              date: dateNow,
            },
          }
        ),
        Agency.updateOne(
          {
            _id: agencyId,
            netAvailableEarnings: { $gt: 0 },
          },
          {
            $inc: {
              netAvailableEarnings: -request.coin,
              totalWithdrawn: request.coin,
              totalWithdrawnAmount: request.amount,
            },
          }
        ),
      ]);

      if (agency.fcmToken) {
        const payload = {
          token: agency.fcmToken,
          data: {
            title: "✅ Withdrawal Approved!",
            body: "🎉 Great news! Your withdrawal has been successfully approved. Keep up the great work! 💼💰",
            type: "WITHDRAWREQUEST",
          },
        };


        admin
          .messaging
          .send(payload)
          .catch((err) => {
            console.error("FCM error:", err.message);
          });
      }
    } else if (actionType === "reject") {
      if (!reason) {
        return res.status(200).json({ status: false, message: "Rejection reason is required." });
      }

      res.status(200).json({
        status: true,
        message: "Withdrawal request declined.",
      });

      await Promise.all([
        WithdrawalRequest.updateOne(
          { _id: request._id },
          {
            $set: {
              status: 3,
              reason: reason.trim(),
              acceptOrDeclineDate: dateNow,
            },
          }
        ),
        History.updateOne(
          { uniqueId: request.uniqueId, type: 5 },
          {
            $set: {
              payoutStatus: 3,
              reason,
              date: dateNow,
            },
          }
        ),
      ]);

      if (agency.fcmToken) {
        const payload = {
          token: agency.fcmToken,
          data: {
            title: "❌ Withdrawal Declined",
            body: "⚠️ Your withdrawal request was declined. Please review the reason or contact support. 📩",
            type: "WITHDRAWREQUEST",
          },
        };

        const adminInstance = await admin;
        adminInstance
          .messaging()
          .send(payload)
          .catch((err) => {
            console.error("FCM error:", err.message);
          });
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Invalid type. Must be 'approve' or 'reject'.",
      });
    }
  } catch (error) {
    console.error("Error in handleAgencyWithdrawalStatus:", error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
