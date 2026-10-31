const Host = require("../../models/host.model");
const FeedPost = require("../../models/feedPost.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const { durSec } = require("../../util/dateRange");
const User = require("../../models/user.model");
const Agency = require("../../models/agency.model");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("mongoose");

//fs
const fs = require("fs");

//deletefile
const { deleteFiles } = require("../../util/deletefile");

//generateUniqueId
const generateUniqueId = require("../../util/generateUniqueId");

//retrive host requests
exports.fetchHostRequest = async (req, res) => {
  try {
    if (!req.query.status) {
      return res
        .status(200)
        .json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let matchQuery = { isFake: false };

    if (req.query.status !== "All") {
      const statusInt = parseInt(req.query.status);
      matchQuery.status = statusInt;

      if (statusInt === 1) {
        matchQuery.agencyId = null;
      }
    }

    const [total, request] = await Promise.all([
      Host.countDocuments(matchQuery),
      Host.find(matchQuery)
        .populate("userId", "name image uniqueId")
        .populate("agencyId", "name image agencyCode")
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);


    return res.status(200).json({
      status: true,
      message: "Retrieve host's request for admin.",
      total: total || 0,
      data: request,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//accept Or decline host request
exports.handleHostRequest = async (req, res) => {
  try {
    if (!settingJSON) {
      return res
        .status(200)
        .json({ status: false, message: "Setting not found." });
    }

    const { requestId, userId, status, reason } = req.query;

    if (!requestId || !userId || !status) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid details provided." });
    }

    const hostObjectId = new mongoose.Types.ObjectId(requestId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const statusNumber = Number(status);

    const host = await Host.findOne({ _id: hostObjectId });

    if (!host) {
      return res
        .status(200)
        .json({ status: false, message: "Host request not found." });
    }

    if (host.agencyId === null) {
      return res.status(200).json({
        status: false,
        message:
          "Please assign this host to an agency before accepting the request.",
      });
    }

    if (host.status === 2) {
      return res.status(200).json({
        status: false,
        message: "Host request has already been accepted.",
      });
    }

    if (host.status === 3) {
      return res.status(200).json({
        status: false,
        message: "Host request has already been rejected.",
      });
    }

    if (statusNumber === 2) {
      host.status = 2;
      host.randomCallRate = settingJSON.generalRandomCallRate;
      host.randomCallFemaleRate = settingJSON.femaleRandomCallRate;
      host.randomCallMaleRate = settingJSON.maleRandomCallRate;
      host.privateCallRate = settingJSON.videoPrivateCallRate;
      host.audioCallRate = settingJSON.audioPrivateCallRate;
      host.chatRate = settingJSON.chatInteractionRate;
      await host.save();

      res.status(200).json({
        status: true,
        message: "Host request accepted successfully.",
        data: host,
      });

      const user = await User.findOne({ _id: userObjectId }).select(
        "isHost hostId",
      );
      if (user) {
        user.isHost = true;
        user.hostId = host._id;
        await user.save();
      }

      if (host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "🎉 Host Verification Successful!",
            body: "Congratulations! Your host request has been approved. You’re now ready to go live! 🚀",
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);
          console.log("Notification sent successfully.");
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }
    } else if (statusNumber === 3) {
      if (!reason || reason.trim() === "") {
        return res.status(200).json({
          status: false,
          message: "Please provide a reason for rejection.",
        });
      }

      host.status = 3;
      host.reason = reason.trim();
      await host.save();

      res.status(200).json({
        status: true,
        message: "Host request rejected successfully.",
        data: host,
      });

      if (host.fcmToken) {
        const payload = {
          token: host.fcmToken,
          data: {
            title: "❌ Host Request Declined",
            body: "Unfortunately, your host request was declined. Please check your details or contact support for assistance. 📩",
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);
          console.log("Notification sent successfully.");
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }
    } else {
      return res
        .status(200)
        .json({ status: false, message: "Invalid status value provided." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//assign host under agency
exports.assignHostToAgency = async (req, res) => {
  try {
    const { requestId, agencyId, userId } = req.query;

    if (!requestId || !agencyId || !userId) {
      return res.status(200).json({
        status: false,
        message: "Required parameters missing: requestId or agencyId.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(requestId) ||
      !mongoose.Types.ObjectId.isValid(agencyId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(200).json({
        status: false,
        message:
          "Invalid requestId or agencyId or userId format. Must be a valid ObjectId.",
      });
    }

    const requestObjectId = new mongoose.Types.ObjectId(requestId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [hostRequest, agency, user] = await Promise.all([
      Host.findOne({ _id: requestObjectId, status: 1 }),
      Agency.findById(agencyId).select("_id name agencyCode").lean(),
      User.findById(userObjectId).select("_id").lean(),
    ]);

    if (!hostRequest) {
      return res
        .status(200)
        .json({ status: false, message: "Host request not found." });
    }

    if (hostRequest.agencyId !== null) {
      return res
        .status(200)
        .json({
          status: false,
          message: "This host request is already assigned to an agency.",
        });
    }

    if (!agency) {
      return res
        .status(200)
        .json({ status: false, message: "Agency not found." });
    }

    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: "User not found." });
    }

    if (hostRequest.status === 2) {
      return res
        .status(200)
        .json({
          status: false,
          message: "This host request has already been accepted.",
        });
    }

    if (hostRequest.status === 3) {
      return res
        .status(200)
        .json({
          status: false,
          message: "This host request has already been rejected.",
        });
    }

    hostRequest.agencyId = agency._id;
    hostRequest.status = 2;
    hostRequest.randomCallRate = settingJSON.generalRandomCallRate;
    hostRequest.randomCallFemaleRate = settingJSON.femaleRandomCallRate;
    hostRequest.randomCallMaleRate = settingJSON.maleRandomCallRate;
    hostRequest.privateCallRate = settingJSON.videoPrivateCallRate;
    hostRequest.audioCallRate = settingJSON.audioPrivateCallRate;
    hostRequest.chatRate = settingJSON.chatInteractionRate;

    res.status(200).json({
      status: true,
      message: "Host successfully assigned to the agency.",
      request: { ...hostRequest.toObject(), agency },
    });

    await Promise.all([
      hostRequest.save(),
      User.updateOne(
        { _id: user._id },
        {
          $set: {
            isHost: true,
            hostId: hostRequest._id,
          },
        },
      ),
    ]);

    if (hostRequest.fcmToken) {
      const payload = {
        token: hostRequest.fcmToken,
        data: {
          title: "🎉 Host Verification Successful!",
          body: "Congratulations! Your host request has been approved. You’re now ready to go live! 🚀",
        },
      };

      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send(payload);
        console.log("Notification sent successfully.");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  } catch (error) {
    console.error("Error in assignHostToAgency:", error);
    return res
      .status(500)
      .json({
        status: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
};

//get agency's hosts
exports.listAgencyHosts = async (req, res) => {
  try {
    if (!req.query.agencyId) {
      return res
        .status(200)
        .json({ status: false, message: "agencyId must be needed." });
    }

    const agencyId = new mongoose.Types.ObjectId(req.query.agencyId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const searchString = req.query.search || "";
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    let searchQuery = {};
    if (searchString !== "All" && searchString !== "") {
      searchQuery = {
        $or: [
          { name: { $regex: searchString, $options: "i" } },
          { email: { $regex: searchString, $options: "i" } },
          { uniqueId: { $regex: searchString, $options: "i" } },
        ],
      };
    }

    const baseQuery = {
      ...dateFilterQuery,
      ...searchQuery,
      agencyId: agencyId,
      status: 2,
      isFake: false,
    };

    const [agency, hosts] = await Promise.all([
      Agency.findOne({ _id: agencyId, isBlock: false }).lean(),
      Host.aggregate([
        { $match: baseQuery },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "followerfollowings",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $addFields: {
            totalFollowers: { $size: "$followers" },
          },
        },
        {
          $project: {
            name: 1,
            gender: 1,
            image: 1,
            impression: 1,
            identityProofType: 1,
            uniqueId: 1,
            isOnline: 1,
            isBusy: 1,
            isLive: 1,
            countryFlagImage: 1,
            country: 1,
            totalFollowers: 1,
          },
        },
      ]),
    ]);

    if (!agency) {
      return res
        .status(200)
        .json({ status: false, message: "Agency not found!" });
    }

    return res.status(200).json({
      status: true,
      message: "Agency wise hosts fetched successfully!",
      hosts,
    });
  } catch (error) {
    console.error("Error fetching agency wise hosts:", error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//create host
exports.createHost = async (req, res) => {
  try {
    const {
      name,
      bio,
      dob,
      gender,
      countryFlagImage,
      country,
      language,
      impression,
      email,
    } = req.body;

    // ================= VALIDATION =================
    if (
      !name ||
      !bio ||
      !dob ||
      !gender ||
      !countryFlagImage ||
      !country ||
      !impression ||
      !language ||
      !req.files ||
      !req.files.image?.length ||
      !req.files.video?.length ||
      !req.files.liveVideo?.length ||
      !req.files.profileVideo?.length
    ) {
      return res.status(200).json({
        status: false,
        message: "Missing or invalid host details or required media files.",
      });
    }

    // ================= DUPLICATE EMAIL CHECK =================
    const existingHost = await Host.findOne({
      email: email?.trim(),
    })
      .select("_id")
      .lean();

    if (existingHost) {
      return res.status(200).json({
        status: false,
        message: "A host profile with this email already exists.",
      });
    }

    // ================= UNIQUE ID =================
    const uniqueId = await generateUniqueId();

    // ================= CREATE HOST =================
    const newHost = new Host({
      name,
      email,
      bio,
      dob,
      gender,
      countryFlagImage,
      country,
      language,
      impression,

      // ================= S3 FILE MAPPING =================
      image: {
        url: req.files.image[0].location,
        key: req.files.image[0].key,
      },

      photoGallery: req.files.photoGallery
        ? req.files.photoGallery.map((file) => ({
            url: file.location,
            key: file.key,
          }))
        : [],

      video: req.files.video.map((file) => ({
        url: file.location,
        key: file.key,
      })),

      profileVideo: req.files.profileVideo.map((file) => ({
        url: file.location,
        key: file.key,
      })),

      liveVideo: req.files.liveVideo.map((file) => ({
        url: file.location,
        key: file.key,
      })),

      // ================= DEFAULT SYSTEM VALUES =================
      uniqueId,
      hostId: new mongoose.Types.ObjectId(),
      status: 2,
      isFake: true,

      randomCallRate: settingJSON.generalRandomCallRate,
      randomCallFemaleRate: settingJSON.femaleRandomCallRate,
      randomCallMaleRate: settingJSON.maleRandomCallRate,
      privateCallRate: settingJSON.videoPrivateCallRate,
      audioCallRate: settingJSON.audioPrivateCallRate,
      chatRate: settingJSON.chatInteractionRate,

      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });

    await newHost.save();

    return res.status(200).json({
      status: true,
      message: "Host created successfully.",
      host: newHost,
    });
  } catch (error) {
    console.error("Create Host Error:", error);
    return res.status(500).json({
      status: false,
      message:
        error.message || "Failed to create host profile due to server error.",
    });
  }
};

// ================= UPDATE HOST =================
exports.updateHost = async (req, res) => {
  try {
    const {
      hostId,
      name,
      email,
      bio,
      dob,
      gender,
      country,
      countryFlagImage,
      language,
      impression,
      randomCallRate,
      randomCallFemaleRate,
      randomCallMaleRate,
      privateCallRate,
      audioCallRate,
      chatRate,
      removePhotoGalleryIndex,
      removeVideoIndexes,
      removeLiveVideoIndex,
      removeProfileVideoIndex,
    } = req.body;

    if (!hostId || !mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid or missing hostId",
      });
    }

    // ---------- helpers ----------
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return JSON.parse(val);
      return [];
    };

    const removePhotos = parseArray(removePhotoGalleryIndex);
    const removeVideos = parseArray(removeVideoIndexes);
    const removeLiveVideos = parseArray(removeLiveVideoIndex);
    const removeProfileVideos = parseArray(removeProfileVideoIndex);

    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found",
      });
    }

    // ================= BASIC FIELDS =================
    if (name) host.name = name;
    if (email) host.email = email;
    if (bio) host.bio = bio;
    if (dob) host.dob = dob;
    if (gender) host.gender = gender;
    if (country) host.country = country;
    if (countryFlagImage) host.countryFlagImage = countryFlagImage;

    if (impression) {
      host.impression =
        typeof impression === "string" ? impression.split(",") : impression;
    }

    if (language) {
      host.language =
        typeof language === "string" ? language.split(",") : language;
    }

    if (randomCallRate !== undefined) host.randomCallRate = randomCallRate;
    if (randomCallFemaleRate !== undefined)
      host.randomCallFemaleRate = randomCallFemaleRate;
    if (randomCallMaleRate !== undefined)
      host.randomCallMaleRate = randomCallMaleRate;
    if (privateCallRate !== undefined) host.privateCallRate = privateCallRate;
    if (audioCallRate !== undefined) host.audioCallRate = audioCallRate;
    if (chatRate !== undefined) host.chatRate = chatRate;

    // ================= PROFILE IMAGE =================
    // ❗ delete ONLY when new image uploaded
    if (req.files?.image?.length > 0) {
      const newImage = req.files.image[0];
      const oldKey = host.image?.key;

      host.image = {
        url: newImage.location,
        key: newImage.key,
      };

      await host.save();

      if (oldKey) {
        try {
          await deleteFromS3(oldKey);
        } catch (err) {
          console.error("Old image delete failed:", err.message);
        }
      }
    }

    // ================= PHOTO GALLERY =================
    if (removePhotos.length) {
      removePhotos
        .sort((a, b) => b - a)
        .forEach(async (index) => {
          const item = host.photoGallery[index];
          if (!item) return;

          host.photoGallery.splice(index, 1);
          if (item.key) {
            try {
              await deleteFromS3(item.key);
            } catch (err) {
              console.error("Photo delete failed:", err.message);
            }
          }
        });
    }

    if (req.files?.photoGallery?.length > 0) {
      host.photoGallery.push(
        ...req.files.photoGallery.map((f) => ({
          url: f.location,
          key: f.key,
        })),
      );
    }

    // ================= VIDEO =================
    if (removeVideos.length) {
      removeVideos
        .sort((a, b) => b - a)
        .forEach(async (index) => {
          const item = host.video[index];
          if (!item) return;

          host.video.splice(index, 1);
          if (item.key) {
            try {
              await deleteFromS3(item.key);
            } catch (err) {
              console.error("Video delete failed:", err.message);
            }
          }
        });
    }

    if (req.files?.video?.length > 0) {
      host.video.push(
        ...req.files.video.map((f) => ({
          url: f.location,
          key: f.key,
        })),
      );
    }

    // ================= LIVE VIDEO =================
    if (removeLiveVideos.length) {
      removeLiveVideos
        .sort((a, b) => b - a)
        .forEach(async (index) => {
          const item = host.liveVideo[index];
          if (!item) return;

          host.liveVideo.splice(index, 1);
          if (item.key) {
            try {
              await deleteFromS3(item.key);
            } catch (err) {
              console.error("Live video delete failed:", err.message);
            }
          }
        });
    }

    if (req.files?.liveVideo?.length > 0) {
      host.liveVideo.push(
        ...req.files.liveVideo.map((f) => ({
          url: f.location,
          key: f.key,
        })),
      );
    }

    // ================= PROFILE VIDEO =================
    if (removeProfileVideos.length) {
      removeProfileVideos
        .sort((a, b) => b - a)
        .forEach(async (index) => {
          const item = host.profileVideo[index];
          if (!item) return;

          host.profileVideo.splice(index, 1);
          if (item.key) {
            try {
              await deleteFromS3(item.key);
            } catch (err) {
              console.error("Profile video delete failed:", err.message);
            }
          }
        });
    }

    if (req.files?.profileVideo?.length > 0) {
      host.profileVideo.push(
        ...req.files.profileVideo.map((f) => ({
          url: f.location,
          key: f.key,
        })),
      );
    }

    await host.save();

    return res.status(200).json({
      status: true,
      message: "Host updated successfully",
      host: host,
    });
  } catch (error) {
    console.error("UpdateHost Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Update failed",
    });
  }
};

//toggle host status
exports.toggleHostStatusByType = async (req, res) => {
  try {
    const { hostId, type } = req.query;

    // ================= VALIDATION =================
    if (!hostId || !type) {
      return res.status(200).json({
        status: false,
        message: "hostId and type are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid hostId format",
      });
    }

    const allowedTypes = ["isBlock", "isBusy", "isLive"];
    if (!allowedTypes.includes(type)) {
      return res.status(200).json({
        status: false,
        message: `Invalid type. Allowed types: ${allowedTypes.join(", ")}`,
      });
    }

    // ================= FIND HOST =================
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found",
      });
    }

    // ================= TOGGLE VALUE =================
    const newValue = !host[type];

    // ================= UPDATE & RETURN UPDATED DOC =================
    const updatedHost = await Host.findByIdAndUpdate(
      hostId,
      { $set: { [type]: newValue } },
      { new: true }, // 🔥 THIS IS THE KEY FIX
    );

    return res.status(200).json({
      status: true,
      message: `Host ${type} has been ${newValue ? "enabled" : "disabled"} successfully`,
      data: updatedHost, // ✅ FULL UPDATED HOST (UI WILL AUTO UPDATE)
    });
  } catch (error) {
    console.error("❌ toggleHostStatusByType Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
//get host's profile
exports.fetchHostProfile = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res
        .status(200)
        .json({ status: false, message: "Host ID must be required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid hostId format." });
    }

    const [host] = await Promise.all([
      Host.findOne({ _id: hostId }).populate(
        "agencyId",
        "name image agencyCode",
      ),
    ]);

    if (!host) {
      return res
        .status(200)
        .json({ status: false, message: "Host not found." });
    }

   

    return res.status(200).json({
      status: true,
      message: "Host profile retrieved successfully.",
      host: host,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get hosts


// ---- shared by Users / Hosts management lists (IST calendar days, escaped search, presence filters) ----
const { escapeRegex, TZ: APP_TZ } = require("../../util/dateRange");
const momentTz = require("moment-timezone");
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** createdAt / lastActiveAt range from YYYY-MM-DD params in the application timezone; legacy "All" -> no filter; invalid -> {error} */
const dayRange = (from, to) => {
  if (!from || !to || from === "All" || to === "All") return {};
  if (DAY_RE.test(from) && DAY_RE.test(to)) {
    const a = momentTz.tz(from, "YYYY-MM-DD", true, APP_TZ).startOf("day"), b = momentTz.tz(to, "YYYY-MM-DD", true, APP_TZ).endOf("day");
    if (!a.isValid() || !b.isValid() || a.isAfter(b)) return { error: "Invalid date range" };
    return { range: { $gte: a.toDate(), $lte: b.toDate() } };
  }
  const a = new Date(from), b = new Date(to); // legacy callers (ISO strings)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return { error: "Invalid date range" };
  b.setHours(23, 59, 59, 999);
  return { range: { $gte: a, $lte: b } };
};
const idList = (q) => String(q || "").split(",").filter((x) => /^[a-f0-9]{24}$/i.test(x)).slice(0, 100);

exports.fetchHostList = async (req, res) => {
  try {
    if (!req.query.type) {
      return res
        .status(200)
        .json({ status: false, message: "Host type is required!" });
    }

    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const searchString = String(req.query.search || "").trim().slice(0, 80);
    const hostType = parseInt(req.query.type);

    const created = dayRange(req.query.startDate, req.query.endDate);
    if (created.error) return res.status(200).json({ status: false, message: created.error });
    const active = dayRange(req.query.lastActiveFrom, req.query.lastActiveTo);
    if (active.error) return res.status(200).json({ status: false, message: active.error });
    const dateFilterQuery = created.range ? { createdAt: created.range } : {};

    const filter = { ...dateFilterQuery, status: 2, isFake: hostType === 1 ? false : true };
    if (searchString && searchString !== "All") {
      const rx = new RegExp(escapeRegex(searchString), "i");
      filter.$or = [{ name: rx }, { email: rx }, { uniqueId: rx }];
    }
    // optional filters (all combinable)
    // the Hosts page sends isOnline / isBlock / isBusy / isLive / country ("true"/"false"); online=online|offline, live=true,
    // status=active|blocked are accepted as well
    const bool = (v) => (v === "true" ? true : v === "false" ? false : undefined);
    const onlineQ = req.query.online === "online" ? true : req.query.online === "offline" ? false : bool(req.query.isOnline);
    if (onlineQ === true) filter.isOnline = true; else if (onlineQ === false) filter.isOnline = { $ne: true };
    const liveQ = req.query.live === "true" ? true : bool(req.query.isLive);
    if (liveQ === true) filter.isLive = true; else if (liveQ === false) filter.isLive = { $ne: true };
    const busyQ = bool(req.query.isBusy);
    if (busyQ === true) filter.isBusy = true; else if (busyQ === false) filter.isBusy = { $ne: true };
    const blockQ = req.query.status === "active" ? false : req.query.status === "blocked" ? true : bool(req.query.isBlock);
    if (blockQ !== undefined) filter.isBlock = blockQ;
    if (req.query.country && String(req.query.country).length <= 60) filter.country = new RegExp(`^${escapeRegex(String(req.query.country).trim())}$`, "i");
    if (/^[a-f0-9]{24}$/i.test(String(req.query.agencyId || ""))) filter.agencyId = new mongoose.Types.ObjectId(req.query.agencyId);
    if (active.range) filter.lastActiveAt = active.range;
    const SORTS = { createdAt: "createdAt", lastActiveAt: "lastActiveAt", coin: "coin", name: "name", totalGifts: "totalGifts" };
    const sortKey = SORTS[req.query.sortBy] || "createdAt";
    const sortDir = req.query.order === "asc" ? 1 : -1;

    const [totalHosts, hostList] = await Promise.all([
      Host.countDocuments(filter),
      Host.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "followerfollowings",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "agencies",
            localField: "agencyId",
            foreignField: "_id",
            as: "agencyId",
          },
        },
        { $unwind: { path: "$agencyId", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            totalFollowers: { $size: "$followers" },
          },
        },
        {
          $project: {
            name: 1,
            gender: 1,
            bio: 1,
            age: 1,
            dob: 1,
            email: 1,
            image: 1,
                mobileNumber: 1,
            video: 1,
            liveVideo: 1,
            profileVideo: 1,
            impression: 1,
            identityProofType: 1,
            identityProof: 1,
            photoGallery: 1,
            uniqueId: 1,
            isBlock: 1,
            isOnline: 1,
            isBusy: 1,
            isLive: 1,
            countryFlagImage: 1,
            country: 1,
            photoGallery: 1,
            randomCallRate: 1,
            randomCallFemaleRate: 1,
            randomCallMaleRate: 1,
            privateCallRate: 1,
            audioCallRate: 1,
            chatRate: 1,
            coin: 1,
            totalGifts: 1,
            language: 1,
            totalFollowers: 1,
            createdAt: 1,
            lastActiveAt: 1,
            "userId._id": 1,
            "userId.name": 1,
            "userId.image": 1,
            "userId.uniqueId": 1,
            "agencyId._id": 1,
            "agencyId.name": 1,
            "agencyId.image": 1,
            "agencyId.agencyCode": 1,
          },
        },
        { $sort: { [sortKey]: sortDir, _id: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    // per-host live + feed statistics for THIS page only (same sources as Host Profile / Live Analytics / Feed Management)
    const pageIds = hostList.map((h) => h._id);
    const [liveRows, feedRows, totalOnlineHosts, totalLiveHosts] = await Promise.all([
      pageIds.length ? LiveBroadcastHistory.aggregate([{ $match: { hostId: { $in: pageIds } } }, { $group: { _id: "$hostId", sessions: { $sum: 1 }, seconds: { $sum: durSec("$duration") } } }]) : [],
      pageIds.length ? FeedPost.aggregate([{ $match: { hostId: { $in: pageIds } } }, { $group: { _id: "$hostId", posts: { $sum: 1 }, reels: { $sum: { $cond: [{ $eq: ["$type", "video"] }, 1, 0] } } } }]) : [],
      Host.countDocuments({ status: 2, isFake: hostType === 1 ? false : true, isOnline: true }),
      Host.countDocuments({ status: 2, isFake: hostType === 1 ? false : true, isLive: true }),
    ]);
    const lm = new Map(liveRows.map((x) => [String(x._id), x])), fm = new Map(feedRows.map((x) => [String(x._id), x]));
    hostList.forEach((h) => {
      const l = lm.get(String(h._id)), f = fm.get(String(h._id));
      h.liveSessions = l?.sessions || 0; h.liveSeconds = l?.seconds || 0; h.feedPosts = f?.posts || 0; h.feedReels = f?.reels || 0;
    });

    return res.status(200).json({
      status: true,
      message: "Hosts retrieved successfully!",
      totalHosts,
      totalOnlineHosts,
      totalLiveHosts,
      hostList,
    });
  } catch (error) {
    console.error("Error fetching hosts:", error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Internal Server Error" });
  }
};


// KPI cards of the Hosts module (same definitions as the list)
exports.hostSummary = async (req, res) => {
  try {
    const created = dayRange(req.query.startDate, req.query.endDate);
    if (created.error) return res.status(200).json({ status: false, message: created.error });
    const real = { isFake: false };
    const [total, online, live, blocked, pending, newHosts] = await Promise.all([
      Host.countDocuments({ ...real, status: 2 }), Host.countDocuments({ ...real, status: 2, isOnline: true }), Host.countDocuments({ ...real, status: 2, isLive: true }),
      Host.countDocuments({ ...real, status: 2, isBlock: true }), Host.countDocuments({ ...real, status: 1 }),
      Host.countDocuments({ ...real, status: 2, ...(created.range ? { createdAt: created.range } : {}) }),
    ]);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "Host summary", data: { total, verified: total, online, live, blocked, active: total - blocked, pendingVerification: pending, newHosts } });
  } catch (e) { return res.status(500).json({ status: false, error: e.message }); }
};

// current presence of specific hosts (admin list patches ONLY these rows when a presence event arrives)
exports.hostPresence = async (req, res) => {
  try {
    const ids = idList(req.query.ids);
    const rows = ids.length ? await Host.find({ _id: { $in: ids } }).select("_id isOnline isLive isBusy isBlock status lastActiveAt").lean() : [];
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: true, message: "Presence", data: rows });
  } catch (e) { return res.status(500).json({ status: false, error: e.message }); }
};

//delete host
exports.deleteHost = async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({
        status: false,
        message: "Missing or invalid host details. Please check and try again.",
      });
    }

    const host = await Host.findOne({ _id: hostId })
      .select("_id image photoGallery video liveVideo profileVideo")
      .lean();

    if (!host) {
      return res
        .status(200)
        .json({ status: false, message: "Host not found." });
    }

    res.status(200).json({
      status: true,
      message: "Host deleted successfully.",
    });

    if (host.image) {
      const imagePath = host.image.includes("storage")
        ? "storage" + host.image.split("storage")[1]
        : "";
      if (imagePath && fs.existsSync(imagePath)) {
        const imageName = imagePath.split("/").pop();
        if (!["male.png", "female.png"].includes(imageName)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (error) {
            console.error(`Error deleting profile image: ${imagePath}`, error);
          }
        }
      }
    }

    if (Array.isArray(host.photoGallery) && host.photoGallery.length > 0) {
      for (const photoUrl of host.photoGallery) {
        if (photoUrl) {
          const photoGalleryPath = photoUrl?.split("storage");
          if (photoGalleryPath?.[1]) {
            const filePath = "storage" + photoGalleryPath[1];
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (error) {
                console.error(
                  `Error deleting gallery image: ${filePath}`,
                  error,
                );
              }
            }
          }
        }
      }
    }

    if (Array.isArray(host.video) && host.video.length > 0) {
      for (const videoUrl of host.video) {
        const videoPath = videoUrl?.split("storage");
        if (videoPath?.[1]) {
          const filePath = "storage" + videoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    if (Array.isArray(host.liveVideo) && host.liveVideo.length > 0) {
      for (const liveVideo of host.liveVideo) {
        const liveVideoPath = liveVideo?.split("storage");
        if (liveVideoPath?.[1]) {
          const filePath = "storage" + liveVideoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    if (Array.isArray(host.profileVideo) && host.profileVideo.length > 0) {
      for (const profileVideo of host.profileVideo) {
        const profileVideoPath = profileVideo?.split("storage");
        if (profileVideoPath?.[1]) {
          const filePath = "storage" + profileVideoPath[1];
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (error) {
              console.error(`Error deleting gallery image: ${filePath}`, error);
            }
          }
        }
      }
    }

    await Host.deleteOne({ _id: hostId });
  } catch (error) {
    console.error("Delete Host Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to delete host due to server error.",
    });
  }
};
