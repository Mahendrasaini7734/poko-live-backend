const Agency = require("../../models/agency.model");
const generateAgencyCode = require("../../util/generateAgencyCode");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");
const { deleteFromS3 } = require("../../util/s3Service");

// =====================================================
// CREATE AGENCY
// =====================================================
exports.createAgency = async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      commissionType,
      commission,
      countryCode,
      mobileNumber,
      description,
      country,
    } = req.body;

    if (
      !uid ||
      !name ||
      !email ||
      !commissionType ||
      !commission ||
      !countryCode ||
      !mobileNumber ||
      !country
    ) {
      return res.status(400).json({
        status: false,
        message: "All required fields are mandatory",
      });
    }

    const existingAgency = await Agency.findOne({
      $or: [{ email: email.toLowerCase() }, { uid }],
    });

    if (existingAgency) {
      return res.status(409).json({
        status: false,
        message: "Agency already exists",
      });
    }

    let imageUrl = "";
    let imageKey = "";

    if (req.file) {
      imageUrl = req.file.location; // S3 URL
      imageKey = req.file.key;      // S3 KEY (agency/xxx.jpg)
    }

    const agency = await Agency.create({
      uid,
      agencyCode: await generateAgencyCode(),
      name,
      email: email.toLowerCase(),
      commissionType: Number(commissionType),
      commission: Number(commission),
      countryCode: Number(countryCode),
      mobileNumber: Number(mobileNumber),
      imageUrl,
      imageKey,
      description: description || "",
      country,
    });

    const agencyData = agency.toObject();
    delete agencyData.password;

    return res.status(201).json({
      status: true,
      message: "Agency created successfully",
      data: agencyData,
    });
  } catch (error) {
    console.error("Create Agency Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// UPDATE AGENCY
// =====================================================
exports.updateAgency = async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) {
      return res.status(400).json({
        status: false,
        message: "Agency ID is required",
      });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({
        status: false,
        message: "Agency not found",
      });
    }

    const {
      uid,
      name,
      email,
      commissionType,
      commission,
      password,
      countryCode,
      mobileNumber,
      description,
      countryFlagImage,
      country,
    } = req.body;

    if (email) {
      const existingAgency = await Agency.findOne({
        email: email.trim(),
        _id: { $ne: agencyId },
      });
      if (existingAgency) {
        return res.status(409).json({
          status: false,
          message: "Email already exists",
        });
      }
      agency.email = email.trim().toLowerCase();
    }

    if (uid) agency.uid = uid;
    if (name) agency.name = name;
    if (commissionType) agency.commissionType = commissionType;
    if (commission) agency.commission = commission;
    if (countryCode) agency.countryCode = countryCode;
    if (mobileNumber) agency.mobileNumber = mobileNumber;
    if (description) agency.description = description;
    if (countryFlagImage) agency.countryFlagImage = countryFlagImage;
    if (country) agency.country = country;

    if (password) {
      agency.password = cryptr.encrypt(password);
    }

    // ---------- IMAGE UPDATE (S3 SAFE) ----------
    if (req.file) {
      const oldImageKey = agency.imageKey;

      agency.imageUrl = req.file.location;
      agency.imageKey = req.file.key;

      await agency.save(); // save first

      if (oldImageKey) {
        try {
          await deleteFromS3(oldImageKey);
        } catch (err) {
          console.error("Failed to delete old S3 image:", err.message);
        }
      }
    } else {
      await agency.save();
    }

    const agencyData = agency.toObject();
    delete agencyData.password;

    return res.status(200).json({
      status: true,
      message: "Agency updated successfully",
      data: agencyData,
    });
  } catch (error) {
    console.error("Update Agency Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// TOGGLE AGENCY BLOCK
// =====================================================
exports.toggleAgencyBlockStatus = async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) {
      return res.status(400).json({
        status: false,
        message: "Agency ID is required",
      });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({
        status: false,
        message: "Agency not found",
      });
    }

    agency.isBlock = !agency.isBlock;
    await agency.save();

    return res.status(200).json({
      status: true,
      message: `Agency ${agency.isBlock ? "blocked" : "unblocked"} successfully`,
      data: agency,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// GET AGENCIES (LIST)
// =====================================================
exports.getAgencies = async (req, res) => {
  try {
    const start = parseInt(req.query.start || 1);
    const limit = parseInt(req.query.limit || 20);
    const searchString = req.query.search || "";

    let matchQuery = {};

    if (searchString && searchString !== "All") {
      matchQuery.$or = [
        { name: { $regex: searchString, $options: "i" } },
        { email: { $regex: searchString, $options: "i" } },
        { agencyCode: { $regex: searchString, $options: "i" } },
      ];
    }

    const [total, agencies] = await Promise.all([
      Agency.countDocuments(matchQuery),
      Agency.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "hosts",
            let: { agencyId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$agencyId", "$$agencyId"] },
                      { $eq: ["$status", 2] },
                      { $eq: ["$isFake", false] },
                    ],
                  },
                },
              },
            ],
            as: "hosts",
          },
        },
        {
          $addFields: {
            totalHosts: { $size: "$hosts" },
            image: "$imageUrl",
          },
        },
        { $unset: "hosts" },
        {
          $project: {
            uid: 1,
            agencyCode: 1,
            name: 1,
            email: 1,
            description: 1,
            commissionType: 1,
            commission: 1,
            countryCode: 1,
            mobileNumber: 1,
            country: 1,
            image: 1,
            imageKey: 1,
            totalHosts: 1,
            hostCoins: 1,
            totalEarnings: 1,
            netAvailableEarnings: 1,
            isBlock: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Agencies retrieved successfully",
      total,
      data: agencies,
    });
  } catch (error) {
    console.error("Get Agencies Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// DELETE AGENCY (WITH S3 IMAGE DELETE)
// =====================================================
exports.deleteAgency = async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) {
      return res.status(400).json({
        status: false,
        message: "Agency ID is required",
      });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({
        status: false,
        message: "Agency not found",
      });
    }

    if (agency.imageKey) {
      try {
        await deleteFromS3(agency.imageKey);
      } catch (err) {
        console.error("Failed to delete S3 image:", err.message);
      }
    }

    await agency.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Agency deleted successfully",
    });
  } catch (error) {
    console.error("Delete Agency Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// =====================================================
// GET ACTIVE AGENCIES LIST (DROPDOWN)
// =====================================================
exports.getActiveAgenciesList = async (req, res) => {
  try {
    const agencies = await Agency.find({ isBlock: false })
      .select("_id name agencyCode imageUrl")
      .lean();

    return res.status(200).json({
      status: true,
      message: "Active agencies retrieved successfully",
      data: agencies,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


























// const Agency = require("../../models/agency.model");
// const Admin = require("../../models/admin.model");
// const generateAgencyCode = require("../../util/generateAgencyCode");
// const Cryptr = require("cryptr");
// const cryptr = new Cryptr("myTotallySecretKey");
// const fs = require("fs");
// const axios = require("axios");
// const { deleteFile } = require("../../util/deletefile");
// const firebaseAdminPromise = require("../../util/privateKey");
// const { deleteFromS3 } = require("../../util/s3Service");


// /// create agency
// exports.createAgency = async (req, res) => {
//   try {
//     const {
//       uid,
//       name,
//       email,
//       commissionType,
//       commission,
//       countryCode,
//       mobileNumber,
//       description,
//       country,
//     } = req.body;

//     // ================= VALIDATION =================
//     if (
//       !uid ||
//       !name ||
//       !email ||
//       !commissionType ||
//       !commission ||
//       !countryCode ||
//       !mobileNumber ||
//       !country
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "All required fields are mandatory",
//       });
//     }

//     // ================= CHECK DUPLICATE =================
//     const existingAgency = await Agency.findOne({
//       $or: [{ email: email.toLowerCase() }, { uid }],
//     });

//     if (existingAgency) {
//       return res.status(409).json({
//         status: false,
//         message: "Agency already exists",
//       });
//     }

//     // ================= IMAGE (S3) =================
//     let imageUrl = "";
//     let imageKey = "";

//     console.log("Uploaded file:", req.file);

//     if (req.file) {
//       imageUrl = req.file.location; // ✅ S3 URL
//       imageKey = req.file.key; // ✅ S3 KEY
//     }

//     // ================= CREATE =================
//     const agency = await Agency.create({
//       uid,
//       agencyCode: await generateAgencyCode(),
//       name,
//       email: email.toLowerCase(),
//       commissionType: Number(commissionType),
//       commission,
//       countryCode: Number(countryCode),
//       mobileNumber: Number(mobileNumber),
//       imageUrl,
//       imageKey,
//       description: description || "",
//       country,
//     });

//     return res.status(201).json({
//       status: true,
//       message: "Agency created successfully",
//       data: agency,
//     });
//   } catch (error) {
//     console.error("Create Agency Error:", error);
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// };


// exports.updateAgency = async (req, res) => {
//   try {
//     const { agencyId } = req.query;

//     const {
//       name,
//       email,
//       commissionType,
//       commission,
//       password,
//       countryCode,
//       mobileNumber,
//       description,
//       countryFlagImage,
//       country,
//       uid,
//     } = req.body;

//     // =========================
//     // VALIDATION
//     // =========================
//     if (!agencyId) {
//       return res.status(400).json({
//         status: false,
//         message: "Agency ID is required.",
//       });
//     }

//     // =========================
//     // FETCH AGENCY
//     // =========================
//     const agency = await Agency.findById(agencyId);
//     if (!agency) {
//       return res.status(404).json({
//         status: false,
//         message: "Agency not found.",
//       });
//     }

//     // =========================
//     // EMAIL DUPLICATE CHECK
//     // =========================
//     if (email) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//       if (!emailRegex.test(email.trim())) {
//         return res.status(400).json({
//           status: false,
//           message: "Invalid email format.",
//         });
//       }

//       const existingAgency = await Agency.findOne({
//         email: email.trim(),
//         _id: { $ne: agencyId },
//       });

//       if (existingAgency) {
//         return res.status(409).json({
//           status: false,
//           message: "Email already exists!",
//         });
//       }

//       agency.email = email.trim();
//     }

//     // =========================
//     // UPDATE BASIC FIELDS
//     // =========================
//     if (uid) agency.uid = uid;
//     if (name) agency.name = name;
//     if (countryCode) agency.countryCode = countryCode;
//     if (mobileNumber) agency.mobileNumber = mobileNumber;
//     if (commissionType) agency.commissionType = commissionType;
//     if (commission) agency.commission = commission;
//     if (description) agency.description = description;
//     if (countryFlagImage) agency.countryFlagImage = countryFlagImage;
//     if (country) agency.country = country;

//     // =========================
//     // PASSWORD UPDATE
//     // =========================
//     if (password) {
//       agency.password = cryptr.encrypt(password);
//     }

//     // =========================
//     // IMAGE UPDATE (S3 LOGIC)
//     // =========================
//     if (req.file) {
//       const oldImageKey = agency.imageKey; // 🔑 purani image key

//       // set new image
//       agency.imageUrl = req.file.location; // ✅ new S3 URL
//       agency.imageKey = req.file.key;      // ✅ new S3 KEY

//       // save first (IMPORTANT)
//       await agency.save();

//       // 🔥 delete old image AFTER successful update
//       if (oldImageKey) {
//         try {
//           await deleteFromS3(oldImageKey);
//           console.log("Old S3 image deleted:", oldImageKey);
//         } catch (err) {
//           console.error("Failed to delete old S3 image:", err.message);
//         }
//       }
//     } else {
//       // no image update
//       await agency.save();
//     }

//     // =========================
//     // RESPONSE
//     // =========================
//     const agencyData = agency.toObject();
//     delete agencyData.password;

//     return res.status(200).json({
//       status: true,
//       message: "Agency updated successfully!",
//       data: agencyData,
//     });
//   } catch (error) {
//     console.error("Update Agency Error:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error.",
//     });
//   }
// };


// //toggle agency block status
// exports.toggleAgencyBlockStatus = async (req, res, next) => {
//   try {
//     const { agencyId } = req.query;

//     if (!agencyId) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Agency ID is required." });
//     }

//     const agency = await Agency.findById(agencyId);
//     if (!agency) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Agency not found." });
//     }

//     agency.isBlock = !agency.isBlock;
//     await agency.save();

//     return res.status(200).json({
//       status: true,
//       message: `Agency has been ${agency.isBlock ? "blocked" : "unblocked"} successfully.`,
//       data: agency,
//     });
//   } catch (error) {
//     console.error("Error updating agency block status:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while updating the agency's block status.",
//     });
//   }
// };

// //get agencies
// exports.getAgencies = async (req, res) => {
//   try {
//     const start = req.query.start ? parseInt(req.query.start) : 1;
//     const limit = req.query.limit ? parseInt(req.query.limit) : 20;
//     const searchString = req.query.search || "";
//     const startDate = req.query.startDate || "All";
//     const endDate = req.query.endDate || "All";

//     let matchQuery = {};

//     // ================= DATE FILTER =================
//     if (startDate !== "All" && endDate !== "All") {
//       const startDateObj = new Date(startDate);
//       const endDateObj = new Date(endDate);
//       endDateObj.setHours(23, 59, 59, 999);

//       matchQuery.createdAt = { $gte: startDateObj, $lte: endDateObj };
//     }

//     // ================= SEARCH FILTER =================
//     if (searchString && searchString !== "All") {
//       matchQuery.$or = [
//         { name: { $regex: searchString, $options: "i" } },
//         { email: { $regex: searchString, $options: "i" } },
//         { agencyCode: { $regex: searchString, $options: "i" } },
//       ];
//     }

//     const [total, agencies] = await Promise.all([
//       Agency.countDocuments(matchQuery),
//       Agency.aggregate([
//         { $match: matchQuery },

//         // ================= HOST COUNT =================
//         {
//           $lookup: {
//             from: "hosts",
//             let: { agencyId: "$_id" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$agencyId", "$$agencyId"] },
//                       { $eq: ["$status", 2] },
//                       { $eq: ["$isFake", false] },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "hosts",
//           },
//         },

//         {
//           $addFields: {
//             totalHosts: { $size: "$hosts" },
//             // ✅ Frontend friendly image field
//             image: "$imageUrl",
//           },
//         },

//         { $unset: "hosts" },

//         // ================= FINAL RESPONSE FIELDS =================
//         {
//           $project: {
//             _id: 1,
//             name: 1,
//             email: 1,
//             agencyCode: 1,
//             description: 1,

//             commissionType: 1,
//             commission: 1,

//             countryCode: 1,
//             mobileNumber: 1,
//             country: 1,
//             image: 1,
//             imageKey: 1,
//             totalHosts: 1,
//             hostCoins: 1,
//             totalEarnings: 1,
//             netAvailableEarnings: 1,
//             isBlock: 1,
//             createdAt: 1,
//           },
//         },

//         { $sort: { createdAt: -1 } },
//         { $skip: (start - 1) * limit },
//         { $limit: limit },
//       ]),
//     ]);

//     return res.status(200).json({
//       status: true,
//       message: "Agencies retrieved successfully!",
//       total,
//       data: agencies,
//     });
//   } catch (error) {
//     console.error("Get Agencies Error:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error.",
//     });
//   }
// };


// //delete agency
// exports.deleteAgency = async (req, res) => {
//   try {
//     const { agencyId } = req.query;

//     if (!agencyId) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Agency ID is required." });
//     }

//     const agency = await Agency.findById(agencyId);
//     if (!agency) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Agency not found." });
//     }

//     await agency.deleteOne();

//     return res.status(200).json({
//       status: true,
//       message: "Agency deleted successfully!",
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Internal server error." });
//   }
// };

// //get agency list ( when assign host under agency )
// exports.getActiveAgenciesList = async (req, res) => {
//   try {
//     const agencies = await Agency.find({ isBlock: false })
//       .select("_id name agencyCode")
//       .lean();

//     return res.status(200).json({
//       status: true,
//       message: "Active agencies retrieved successfully.",
//       data: agencies,
//     });
//   } catch (error) {
//     console.error("Error in getActiveAgenciesList:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };