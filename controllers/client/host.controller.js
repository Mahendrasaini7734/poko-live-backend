const Host = require("../../models/host.model");
const Agency = require("../../models/agency.model");
const Impression = require("../../models/impression.model");
const Gift = require("../../models/gift.model");
const {
  getDisplayName,
} = require("../../util/hostDisplay");
const History = require("../../models/history.model");
const Block = require("../../models/block.model");
const FollowerFollowing = require("../../models/followerFollowing.model");
const User = require("../../models/user.model");
const Chat = require("../../models/chat.model");
const LiveBroadcastHistory = require("../../models/liveBroadcastHistory.model");
const { deleteFile, deleteFiles } = require("../../util/deletefile");
const generateUniqueId = require("../../util/generateUniqueId");
const admin = require("../../util/privateKey");
const firebase = require("../../util/privateKey");
const mongoose = require("mongoose");
const { deleteFromS3 } = require("../../util/s3Service");
const { getMediaUrl, getMediaUrls } = require("../../util/media");
const FeedPost = require("../../models/feedPost.model");
const { getHostFeedCounts } = require("./feed.controller");

//get impression list
exports.getPersonalityImpressions = async (req, res) => {
  try {
    const personalityImpressions = await Impression.find({}).select("name").sort({ createdAt: -1 }).lean();

    res.status(200).json({
      status: true,
      message: `Personality impressions retrieved successfully.`,
      personalityImpressions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Failed to retrieve personality impressions." });
  }
};

//validate agencyCode ( user )
exports.validateAgencyCode = async (req, res) => {
  try {
    const { agencyCode } = req.query;

    if (!agencyCode) {
      return res.status(200).json({ status: false, message: "Agency code is required." });
    }

    const agencyExists = await Agency.exists({ agencyCode: agencyCode });

    if (agencyExists) {
      return res.status(200).json({ status: true, message: "Valid agency code.", isValid: true });
    } else {
      return res.status(200).json({ status: false, message: "Invalid agency code.", isValid: false });
    }
  } catch (error) {
    console.error("Error validating agency code:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

//host request ( user )
// host request (user → admin)
exports.initiateHostRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }



    const userId = new mongoose.Types.ObjectId(req.user.userId);
    console.log(req.body);
    const {
      images_option,
      email,
      fcmToken,
      name,
      bio,
      dob,
      gender,
      countryFlagImage,
      country,
      language,
      // impression,
      agencyCode,
      // identityProofType,
      mobileNumber,
      countryCode,
    } = req.body;

    // ---------- BASIC VALIDATION ----------
    if (
      // !email ||
      !fcmToken ||
      !name ||
      !bio ||
      !dob ||
      !gender ||
      !countryFlagImage ||
      !country ||
      // !impression ||
      !language ||
      // !identityProofType ||
      // !mobileNumber ||
      // !countryCode ||
      !req.files
    ) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    // if (!req.files.image || !req.files.photoGallery || !req.files.identityProof) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Required files are missing.",
    //   });
    // }

    if (!req.files.image || !req.files.photoGallery) {
      return res.status(200).json({
        status: false,
        message: "Required files are missing.",
      });
    }

    // ---------- CHECK EXISTING ----------
    const [uniqueId, agencyDetails, existingHost, declinedHost] =
      await Promise.all([
        generateUniqueId(),
        agencyCode
          ? Agency.findOne({ agencyCode }).select("_id").lean()
          : null,
        Host.findOne({ status: 1, userId }).select("_id").lean(),
        Host.findOne({ status: 3, userId }).select("_id").lean(),
      ]);

    if (existingHost) {
      return res.status(200).json({
        status: false,
        message: "A host request already exists.",
      });
    }

    if (agencyCode && !agencyDetails) {
      return res.status(200).json({
        status: false,
        message: "Invalid agency code.",
      });
    }

    // ---------- REMOVE OLD DECLINED ----------
    if (declinedHost) {
      await Host.findByIdAndDelete(declinedHost._id);
    }

    // // ---------- FORMAT ARRAYS ----------
    // const impressions =
    //   typeof impression === "string"
    //     ? impression.split(",").map((i) => i.trim())
    //     : impression;

    const languages =
      typeof language === "string"
        ? language.split(",").map((l) => l.trim())
        : language;

    // 👇 YAHAN ADD KARO
    const user = await User.findById(userId);

    if (email && !user.email) {
      user.email = email.trim();
      await user.save();
    }

    // ---------- CREATE HOST ----------
    const newHost = new Host({
      userId,
      agencyId: agencyDetails ? agencyDetails._id : null,

      email,
      fcmToken,
      name,
      bio,
      dob,
      gender,
      images_option,
      countryFlagImage,
      country,
      language: 'English',
      impression: [],
      // identityProofType,

      // ===== S3 FILES (IMPORTANT) =====
      image: {
        url: getMediaUrl(req.files.image[0].key),
        key: req.files.image[0].key,
      },

      photoGallery: req.files.photoGallery.map((file) => ({
        url: getMediaUrl(file.key),
        key: file.key,
      })),
      profileVideo: req.files.profileVideo
        ? req.files.profileVideo.map((file) => ({
          url: getMediaUrl(file.key),
          key: file.key,
        }))
        : [],

      identityProof: req.files.identityProof
        ? req.files.identityProof.map((file) => ({
          url: getMediaUrl(file.key),
          key: file.key,
        }))
        : [],

      mobileNumber: String(
        mobileNumber
      ).trim(),

      countryCode: String(
        countryCode
      ).trim(),

      uniqueId,
      status: 1, // pending
      date: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    });

    await newHost.save();

    // ---------- SEND RESPONSE FIRST ----------
    res.status(200).json({
      status: true,
      message: "Host request successfully sent.",
    });

    // ---------- FCM NOTIFICATION ----------
    if (fcmToken) {
      try {

        await admin.messaging.send({
          token: fcmToken,
          data: {
            title: "🎙️ Host Application Received",
            body:
              "Your host request has been submitted successfully. Our team will review it shortly.",
          },
        });
      } catch (err) {
        console.error("FCM error:", err);
      }
    }
  } catch (error) {
    console.error("initiateHostRequest error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};


//get host's request status ( user )
exports.verifyHostRequestStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const host = await Host.findOne({ userId: userId }).select("status").lean();
    if (!host) {
      return res.status(200).json({ status: false, message: "Request not found for that user!" });
    }

    return res.status(200).json({
      status: true,
      message: "Request status retrieved successfully",
      data: host?.status,
    });
  } catch (error) {
    console.error("Error fetching request status:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};


// ======================================
// RETYRIVE HOST DATA
// ======================================


exports.retrieveHosts = async (req, res) => {
  try {
    const start = Math.max(
      Number(req.query.start || 1),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit || 20),
        1
      ),
      100
    );

    const skip = (start - 1) * limit;

    if (!req.user?.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const currentUserId =
      new mongoose.Types.ObjectId(
        req.user.userId
      );

    const country = String(
      req.query.country || "global"
    )
      .trim()
      .toLowerCase();

    const isGlobal =
      country === "global";

    const match = {
      status: 2,
      isBlock: false,
      userId: {
        $ne: currentUserId,
      },
      $or: [
        {
          isLive: true,
        },
        {
          isOnline: true,
        },
      ],
    };

    if (!isGlobal) {
      match.country = {
        $regex: new RegExp(
          `^${country}$`,
          "i"
        ),
      };
    }

    const basePipeline = [
      {
        $match: match,
      },
      {
        $group: {
          _id: "$_id",
          doc: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },
    ];

    const totalResult =
      await Host.aggregate([
        ...basePipeline,
        {
          $count: "total",
        },
      ]);

    const total =
      totalResult?.[0]?.total || 0;

    const hosts = await Host.aggregate([
      ...basePipeline,

      {
        $lookup: {
          from: "followerfollowings",
          let: {
            hostId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$followingId",
                    "$$hostId",
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: "followers",
        },
      },

      {
        $lookup: {
          from: "followerfollowings",
          let: {
            hostId: "$_id",
            currentUserId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$followingId",
                        "$$hostId",
                      ],
                    },
                    {
                      $eq: [
                        "$followerId",
                        "$$currentUserId",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: "isFollowingData",
        },
      },

      {
        $addFields: {
          followerCount: {
            $size: "$followers",
          },

          isFollowing: {
            $gt: [
              {
                $size:
                  "$isFollowingData",
              },
              0,
            ],
          },

          hostType: {
            $cond: [
              {
                $eq: [
                  "$isLive",
                  true,
                ],
              },
              "live",
              "online",
            ],
          },

          statusText: {
            $cond: [
              {
                $eq: [
                  "$isLive",
                  true,
                ],
              },
              "Live",
              "Online",
            ],
          },

          channel: {
            $ifNull: [
              "$channel",
              "",
            ],
          },

          token: {
            $ifNull: [
              "$token",
              "",
            ],
          },

          liveHistoryId: {
            $ifNull: [
              "$liveHistoryId",
              null,
            ],
          },

          view: {
            $ifNull: [
              "$view",
              0,
            ],
          },

          random: {
            $rand: {},
          },
        },
      },

      {
        $project: {
          _id: 1,
          userId: 1,

          name: 1,
          age: 1,
          uniqueId: 1,

          image: 1,
          video: 1,

          country: 1,
          countryFlagImage: 1,
          language: 1,

          hostType: 1,
          status: "$statusText",

          isLive: 1,
          isOnline: 1,
          isBusy: 1,
          isFake: 1,

          followerCount: 1,
          isFollowing: 1,

          view: 1,
          coin: 1,
          totalGifts: 1,

          audioCallRate: 1,
          privateCallRate: 1,
          randomCallRate: 1,
          randomCallFemaleRate: 1,
          randomCallMaleRate: 1,
          chatRate: 1,

          channel: 1,
          token: 1,
          agoraUid: 1,
          liveHistoryId: 1,

          createdAt: 1,
          random: 1,
        },
      },

      {
        $sort: {
          isLive: -1,
          random: 1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: limit,
      },
    ]);

    const hostsWithFakeData =
      hosts.map((host) => {
        const realView =
          Number(
            host.view || 0
          );

        const realCoin =
          Number(
            host.coin || 0
          );

        let fakeViews = 0;
        let fakeCoins = 0;

        if (realCoin <= 0) {
          fakeViews =
            Math.floor(
              Math.random() * 1000
            ) + 100;

          fakeCoins =
            Math.floor(
              Math.random() * 20000
            ) + 5000;
        }

        const displayCoin =
          realCoin > 0
            ? Math.round(
              realCoin
            )
            : fakeCoins;

        return {
          ...host,
          name: getDisplayName(
            host.name,
            host._id
          ),

          displayName:
            getDisplayName(
              host.name,
              host._id
            ),

          realView,

          fakeView: fakeViews,

          view:
            realView +
            fakeViews,

          realCoin,

          fakeCoin: fakeCoins,

          coin: displayCoin,
        };
      });

    const followingHosts =
      hostsWithFakeData.filter(
        (host) =>
          host.isFollowing === true
      );

    return res.status(200).json({
      status: true,
      message:
        "Hosts retrieved successfully",

      total,

      totalPages:
        Math.ceil(
          total / limit
        ),

      start,
      limit,

      country,

      hosts:
        hostsWithFakeData,

      followingHosts,
    });
  } catch (error) {
    console.log(
      "❌ RETRIEVE HOST ERROR =>",
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
//get host profile ( user )


const getRandomProfileViewNotification = (userName) => {
  const messages = [
    `${userName} 👀 viewed your profile!`,
    `${userName} ✨ just checked out your profile!`,
    `${userName} 👋 visited your profile!`,
    `${userName} 💫 took a look at your profile!`,
    `${userName} 😍 viewed your profile!`,
    `${userName} 🔥 just visited your profile!`,
    `${userName} 👀 stopped by your profile!`,
    `${userName} 💖 checked your profile!`,
    `${userName} 🌟 just viewed your profile!`,
    `${userName} 🫶 visited your profile!`,
  ];

  return messages[
    Math.floor(Math.random() * messages.length)
  ];
};


exports.retrieveHostDetails = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const { hostId } = req.query;

    if (
      !hostId ||
      !mongoose.Types.ObjectId.isValid(hostId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Valid hostId is required.",
      });
    }

    const userId = new mongoose.Types.ObjectId(
      req.user.userId
    );

    const hostObjectId =
      new mongoose.Types.ObjectId(hostId);

    const [
      host,
      giftHistory,
      isFollowing,
      totalFollower,
      totalFollowing,
    ] = await Promise.all([
      Host.findOne({
        _id: hostObjectId,
        isBlock: false,
      })
        .select(
          [
            "name",
            "email",
            "gender",
            "bio",
            "uniqueId",
            "countryFlagImage",
            "country",
            "impression",
            "language",
            "image",
            "photoGallery",
            "profileVideo",
            "video",
            "liveVideo",
            "randomCallRate",
            "randomCallFemaleRate",
            "randomCallMaleRate",
            "privateCallRate",
            "audioCallRate",
            "chatRate",
            "coin",
            "isFake",
            "isOnline",
            "isBusy",
            "isLive",
            "createdAt",
            "view",
          ].join(" ")
        )
        .lean(),

      History.aggregate([
        {
          $match: {
            hostId: hostObjectId,
            giftId: {
              $exists: true,
              $ne: null,
            },
            type: 2,
          },
        },
        {
          $group: {
            _id: "$giftId",

            totalReceived: {
              $sum: {
                $ifNull: ["$giftCount", 0],
              },
            },

            lastReceivedAt: {
              $max: "$createdAt",
            },

            giftCoin: {
              $first: "$giftCoin",
            },

            giftImage: {
              $first: "$giftImage",
            },

            giftsvgaImage: {
              $first: "$giftsvgaImage",
            },

            giftType: {
              $first: "$giftType",
            },
          },
        },
        {
          $sort: {
            totalReceived: -1,
          },
        },
      ]),

      FollowerFollowing.exists({
        followerId: userId,
        followingId: hostObjectId,
      }),

      FollowerFollowing.countDocuments({
        followingId: hostObjectId,
      }),

      FollowerFollowing.countDocuments({
        followerId: hostObjectId,
      }),
    ]);

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }

    // =====================================================
    // HOST PROFILE VIEW NOTIFICATION
    // =====================================================
   try {
  const hostNotificationData = await Host.findOne({
    _id: hostObjectId,
    isBlock: false,
  })
    .select("userId fcmToken")
    .lean();

  let hostFcmToken = hostNotificationData?.fcmToken || "";

  let hostUser = null;

  if (!hostFcmToken && hostNotificationData?.userId) {
    hostUser = await User.findOne({
      _id: hostNotificationData.userId,
      isBlock: false,
    })
      .select("_id name fcmToken")
      .lean();

    hostFcmToken = hostUser?.fcmToken || "";
  }

  const viewer = await User.findOne({
    _id: userId,
    isBlock: false,
  })
    .select("_id name image")
    .lean();

  if (
    hostFcmToken &&
    hostNotificationData?.userId &&
    hostNotificationData.userId.toString() !== userId.toString()
  ) {
    const viewerName =
      viewer?.name?.trim() ||
      "Someone";

    const viewerImage = getMediaUrl(
      viewer?.image?.url ||
      viewer?.image ||
      ""
    );

    const notificationBody =
      getRandomProfileViewNotification(viewerName);

    const payload = {
      token: hostFcmToken,
      data: {
        title: "👀 Profile View",
        body: notificationBody,
        type: "PROFILE_VIEW",
        viewerId: String(userId),
        viewerName: String(viewerName),
        viewerImage: String(viewerImage),
        image: String(viewerImage),
        senderImage: String(viewerImage),
        hostId: String(hostObjectId),
        hostName: String(host.name || ""),
        isFakeSender: "false",
      },
    };

    try {
      const firebaseResponse =
        await firebase.messaging.send(payload);

      console.log(
        "✅ HOST PROFILE VIEW NOTIFICATION SENT =>",
        firebaseResponse
      );

      console.log(
        "🖼️ PROFILE VIEW IMAGE =>",
        viewerImage
      );
    } catch (notificationError) {
      console.error(
        "❌ HOST PROFILE VIEW NOTIFICATION ERROR =>",
        notificationError.message
      );
    }
  } else {
    console.log(
      "⚠️ HOST PROFILE VIEW => FCM TOKEN NOT FOUND OR SELF PROFILE"
    );
  }
} catch (notificationError) {
  console.error(
    "❌ PROFILE VIEW NOTIFICATION PROCESS ERROR =>",
    notificationError.message
  );
}

    // =====================================================
    // EXISTING CODE — NO CHANGE
    // =====================================================

    const giftIds = giftHistory
      .map((item) => item._id)
      .filter(Boolean);

    const gifts = giftIds.length
      ? await Gift.find({
        _id: {
          $in: giftIds,
        },
      })
        .select(
          "_id coin type imageUrl imageKey svgaImageUrl svgaImageKey"
        )
        .lean()
      : [];

    const giftMap = new Map(
      gifts.map((gift) => [
        gift._id.toString(),
        gift,
      ])
    );

    const receivedGifts =
      giftHistory.map((item) => {
        const gift = giftMap.get(
          item._id.toString()
        );

        const image =
          item.giftImage ||
          gift?.imageUrl ||
          gift?.imageKey ||
          "";

        const svgImage =
          item.giftsvgaImage ||
          gift?.svgaImageUrl ||
          gift?.svgaImageKey ||
          "";

        return {
          totalReceived:
            item.totalReceived || 0,

          lastReceivedAt:
            item.lastReceivedAt || null,

          giftId:
            item._id,

          giftCoin:
            Number(
              item.giftCoin ||
              gift?.coin ||
              0
            ),

          giftImage:
            getMediaUrl(image),

          giftsvgaImage:
            getMediaUrl(svgImage),

          giftType:
            Number(
              item.giftType ||
              gift?.type ||
              1
            ),
        };
      });

    host.image =
      host.image || "";

    host.photoGallery =
      Array.isArray(host.photoGallery)
        ? host.photoGallery
        : [];

    host.profileVideo =
      Array.isArray(host.profileVideo)
        ? host.profileVideo
        : [];

    host.video =
      Array.isArray(host.video)
        ? host.video
        : [];

    host.liveVideo =
      Array.isArray(host.liveVideo)
        ? host.liveVideo
        : [];

    host.impression =
      Array.isArray(host.impression)
        ? host.impression
        : [];

    host.language =
      Array.isArray(host.language)
        ? host.language
        : [];

    host.isFollowing =
      Boolean(isFollowing);

    // feed section visibility (no feed payload here -> light response)
    try {
      const feedCounts = await getHostFeedCounts(hostObjectId);
      host.feedCount = feedCounts.feed;
      host.reelsCount = feedCounts.reels;
      host.imagesCount = feedCounts.images;
    } catch (e) {
      host.feedCount = host.reelsCount = host.imagesCount = 0;
    }
    host.giftsCount = receivedGifts.length;

    let fakeView = 0;
    let fakeCoin = 0;

    const fakeFollowing =
      Math.floor(
        Math.random() * 1000
      ) + 1000;

    const fakeFollowers =
      Math.floor(
        Math.random() * 1200
      ) + 1000;

    if (host.isLive) {
      fakeView =
        Math.floor(
          Math.random() * 250
        ) + 50;

      fakeCoin =
        Math.floor(
          Math.random() * 5000
        ) + 1000;
    }

    host.actualView =
      host.view || 0;

    host.fakeView =
      fakeView;

    host.view =
      (host.view || 0) +
      fakeView;

    host.actualCoin =
      host.coin || 0;

    host.fakeCoin =
      fakeCoin;

    host.coin =
      Math.round(
        (host.coin || 0) +
        fakeCoin
      );


    host.name = getDisplayName(
      host.name,
      host.otherUserId
    ),


      host.totalFollower =
      (totalFollower || 0) +
      fakeFollowers;

    host.totalFollowing =
      (totalFollowing || 0) +
      fakeFollowing;

    if (host.isLive) {
      host.status = "Live";
    } else if (host.isBusy) {
      host.status = "Busy";
    } else if (host.isOnline) {
      host.status = "Online";
    } else {
      host.status = "Offline";
    }

    // =====================================================
    // SAME RESPONSE — EXACTLY AS BEFORE
    // =====================================================

    return res.status(200).json({
      status: true,

      message:
        "The host profile retrieved successfully.",

      host,

      receivedGifts,
    });

  } catch (error) {
    console.error(
      "❌ retrieveHostDetails error:",
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

//get host profile ( host )
exports.fetchHostInfo = async (req, res) => {
  try {
    if (
      !req.query.hostId ||
      !mongoose.Types.ObjectId.isValid(req.query.hostId)
    ) {
      return res.status(200).json({
        status: false,
        message: "Invalid or missing hostId.",
      });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    const currentUserId =
      req.user?.userId &&
        mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : null;

    const formatMedia = (media) => {
      if (!media) {
        return {
          url: "",
          key: "",
        };
      }

      if (typeof media === "string") {
        return {
          key: media,
          url: getMediaUrl(media),
        };
      }

      const key = media.key || "";

      return {
        key,
        url: key ? getMediaUrl(key) : "",
      };
    };

    const hostPromise = Host.findOne({
      _id: hostId,
      isBlock: false,
    })
      .select(`
        userId
        name
        email
        gender
        dob
        bio
        uniqueId
        country
        countryFlagImage
        language
        impression
        image
        photoGallery
        profileVideo
        coin
        beans
        totalGifts
        profileView
        isOnline
        isLive
        isBusy
        isFake
        isVerified
        channel
        token
        agoraUid
        liveHistoryId
        audioCallRate
        privateCallRate
        chatRate
        randomCallRate
        randomCallFemaleRate
        randomCallMaleRate
        createdAt
        agencyId
      `)
      .lean();

    const followersCountPromise =
      FollowerFollowing.countDocuments({
        followingId: hostId,
      });

    const followingCountPromise = Host.findById(hostId)
      .select("userId")
      .lean()
      .then((hostData) => {
        if (!hostData?.userId) {
          return 0;
        }

        return FollowerFollowing.countDocuments({
          followerId: hostData.userId,
        });
      });

    const isFollowingPromise = currentUserId
      ? FollowerFollowing.exists({
        followerId: currentUserId,
        followingId: hostId,
      })
      : Promise.resolve(false);

    const userPromise = currentUserId
      ? User.findById(currentUserId)
        .select("_id coin")
        .lean()
      : Promise.resolve(null);

    const [
      host,
      followersCount,
      followingCount,
      isFollowingCheck,
      user,
    ] = await Promise.all([
      hostPromise,
      followersCountPromise,
      followingCountPromise,
      isFollowingPromise,
      userPromise,
    ]);

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }

    // Feed data is NOT part of this response any more (it was 12 posts + like/comment lookups on
    // every profile open). Feed / reels / images previews come from GET /feed/host/:hostId/preview;
    // only the cheap counts are returned here so the app knows which sections exist.
    const feedCounts = await getHostFeedCounts(hostId).catch(() => ({ feed: 0, reels: 0, images: 0 }));
    const formattedImagePosts = [];
    const formattedVideoPosts = [];

    let agency = null;

    if (
      host.agencyId &&
      mongoose.Types.ObjectId.isValid(host.agencyId)
    ) {
      agency = await Agency.findById(host.agencyId)
        .select("name image uniqueId")
        .lean();

      if (agency?.image) {
        agency.image = formatMedia(
          agency.image
        );
      }
    }

    host.coin = Number(
      Number(host.coin || 0).toFixed(2)
    );

    host.beans = Math.round(
      Number(host.coin) 
    );

    host.followersCount =
      followersCount || 0;

    host.followingCount =
      followingCount || 0;

    host.isFollowing =
      Boolean(isFollowingCheck);

    host.agency = agency;

    host.displayName = getDisplayName(
      host.name,
      host._id
    );

    host.image = formatMedia(
      host.image
    );

    host.photoGallery =
      Array.isArray(host.photoGallery)
        ? host.photoGallery
          .map((item) => formatMedia(item))
          .filter((item) => item.key)
        : [];

    host.profileVideo =
      Array.isArray(host.profileVideo)
        ? host.profileVideo
          .map((item) => formatMedia(item))
          .filter((item) => item.key)
        : [];

    host.language =
      Array.isArray(host.language)
        ? host.language
        : [];

    host.impression =
      Array.isArray(host.impression)
        ? host.impression
        : [];

    host.feed = {
      images: formattedImagePosts, // kept (empty) so older app builds do not break
      videos: formattedVideoPosts,
    };
    host.feedCount = feedCounts.feed;
    host.reelsCount = feedCounts.reels;
    host.imagesCount = feedCounts.images;

    const userCoins = Number(
      user?.coin || 0
    );


    return res.status(200).json({
      status: true,
      message:
        "The host profile retrieved successfully.",
      userCoins,
      host,
    });
  } catch (error) {
    console.log(
      "❌ Fetch Host Info Error =>",
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


//get random free host ( random video call ) ( user )
exports.retrieveAvailableHost = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const start = Math.max(
      parseInt(req.query.start || "1"),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit || "20"),
        1
      ),
      50
    );

    const userId = new mongoose.Types.ObjectId(
      req.user.userId
    );

    const [blockedHosts, hosts] = await Promise.all([
      Block.find({
        userId,
        blockedBy: "user",
      })
        .select("hostId")
        .lean(),

      Host.find({
        isOnline: true,
        isBusy: false,
        isLive: false,
        isBlock: false,
        status: 2,
        callId: null,
      })
        .select(
          "_id name uniqueId image gender country countryFlagImage languages isOnline isBusy isLive audioCallRate privateCallRate agencyId coin"
        )
        .lean(),
    ]);

    const blockedHostIds = blockedHosts
      .filter((item) =>
        mongoose.Types.ObjectId.isValid(item.hostId)
      )
      .map((item) => item.hostId.toString());

    let availableHosts = hosts.filter(
      (host) =>
        !blockedHostIds.includes(
          host._id.toString()
        )
    );

    const total = availableHosts.length;

    if (!total) {
      return res.status(200).json({
        status: true,
        message: "No available hosts found.",
        data: [],
        pagination: {
          total: 0,
          start,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: start > 1,
        },
      });
    }

    availableHosts = availableHosts
      .sort(() => Math.random() - 1);

    const totalPages = Math.ceil(
      total / limit
    );

    const paginatedHosts =
      availableHosts.slice(
        (start - 1) * limit,
        start * limit
      );

    const hostIds = paginatedHosts.map(
      (host) => host._id
    );

    const [
      followerCounts,
      followingDocuments,
    ] = await Promise.all([
      FollowerFollowing.aggregate([
        {
          $match: {
            followingId: {
              $in: hostIds,
            },
          },
        },
        {
          $group: {
            _id: "$followingId",
            followers: {
              $sum: 1,
            },
          },
        },
      ]),

      FollowerFollowing.find({
        followerId: userId,
        followingId: {
          $in: hostIds,
        },
      })
        .select("followingId")
        .lean(),
    ]);



    const followerMap = new Map(
      followerCounts.map((item) => [
        item._id.toString(),
        Number(item.followers || 0),
      ])
    );

    const data = paginatedHosts.map((host) => {
      const actualFollowers =
        followerMap.get(
          host._id.toString()
        ) || 0;

      const followingSet = new Set(
        followingDocuments.map((item) =>
          item.followingId.toString()
        )
      );
      const fakeFollowers =
        Math.floor(
          Math.random() * 10000
        ) + 10;


      const displayFollowers =
        actualFollowers +
        fakeFollowers;

      const hostIdString =
        host._id.toString();

      return {
        _id: host._id,

        name:
          host.name || "",

        uniqueId:
          host.uniqueId || "",

        image:
          host.image || "",

        gender:
          host.gender || "",

        country:
          host.country || "",

        countryFlagImage:
          host.countryFlagImage || "",

        isOnline:
          Boolean(host.isOnline),

        isBusy:
          Boolean(host.isBusy),

        isLive:
          Boolean(host.isLive),

        audioPrivateCallRate:
          Number(
            host.audioCallRate || 0
          ),

        videoPrivateCallRate:
          Number(
            host.privateCallRate || 0
          ),

        languages:
          Array.isArray(host.languages) &&
            host.languages.length
            ? host.languages
            : [
              "Hindi",
              "English",
            ],

        followers: actualFollowers,

        fakeFollowers,

        displayFollowers,
        isFollowing:
          followingSet.has(
            hostIdString
          ),


        beans:
          Number(
            Number(host.coin || 0).toFixed(2)
          ),

        agencyId:
          host.agencyId || null,
      };
    });

    return res.status(200).json({
      status: true,
      message:
        "Available hosts retrieved successfully.",

      data,

      pagination: {
        total,
        start,
        limit,
        totalPages,
        currentPage: start,
        hasNextPage:
          start < totalPages,
        hasPreviousPage:
          start > 1,
      },
    });
  } catch (error) {
    console.error(
      "retrieveAvailableHost Error:",
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

//update host's info  ( host )
exports.modifyHostDetails = async (req, res) => {
  try {
    const {
      hostId,
      name,
      bio,
      dob,
      gender,
      countryFlagImage,
      country,
      language,
      impression,
      email,
      randomCallRate,
      randomCallFemaleRate,
      randomCallMaleRate,
      privateCallRate,
      audioCallRate,
      chatRate,
      removePhotoGalleryIndex,
      removeProfileVideoIndex,
    } = req.body;

    console.log("\n========== MODIFY HOST ==========");
    console.log("Host ID:", hostId);
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("=================================");

    if (!hostId || !mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({
        status: false,
        message: "Valid hostId is required",
      });
    }

    // ================= HELPERS =================

    const parseArray = (value) => {
      if (!value) return [];

      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === "string") {
        if (!value.trim()) return [];

        try {
          const parsed = JSON.parse(value);

          if (Array.isArray(parsed)) {
            return parsed;
          }

          return [];
        } catch (error) {
          // Flutter kabhi "0,1,2" bheje to
          return value
            .split(",")
            .map((item) => Number(item.trim()))
            .filter((item) => !Number.isNaN(item));
        }
      }

      return [];
    };

    const removePhotos = parseArray(removePhotoGalleryIndex);
    const removeProfileVideos = parseArray(removeProfileVideoIndex);

    // ================= FETCH HOST =================

    const host = await Host.findOne({
      _id: hostId,
      isBlock: false,
    });

    if (!host) {
      return res.status(200).json({
        status: false,
        message: "Host not found",
      });
    }

    // ================= BASIC DETAILS =================

    if (name !== undefined) host.name = name;
    if (email !== undefined) host.email = email;
    if (bio !== undefined) host.bio = bio;
    if (dob !== undefined) host.dob = dob;
    if (gender !== undefined) host.gender = gender;
    if (country !== undefined) {
      host.country = String(country).trim().toLowerCase();
    }

    if (countryFlagImage !== undefined) {
      host.countryFlagImage = countryFlagImage;
    }

    // ================= LANGUAGE =================

    if (language !== undefined) {
      if (Array.isArray(language)) {
        host.language = language;
      } else if (typeof language === "string") {
        try {
          const parsed = JSON.parse(language);

          host.language = Array.isArray(parsed)
            ? parsed
            : language.split(",").map((e) => e.trim());
        } catch {
          host.language = language
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
        }
      }
    }

    // ================= IMPRESSION =================

    if (impression !== undefined) {
      if (Array.isArray(impression)) {
        host.impression = impression;
      } else if (typeof impression === "string") {
        try {
          const parsed = JSON.parse(impression);

          host.impression = Array.isArray(parsed)
            ? parsed
            : impression.split(",").map((e) => e.trim());
        } catch {
          host.impression = impression
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
        }
      }
    }

    // ================= CALL RATES =================

    if (randomCallRate !== undefined) {
      host.randomCallRate = Number(randomCallRate);
    }

    if (randomCallFemaleRate !== undefined) {
      host.randomCallFemaleRate = Number(randomCallFemaleRate);
    }

    if (randomCallMaleRate !== undefined) {
      host.randomCallMaleRate = Number(randomCallMaleRate);
    }

    if (privateCallRate !== undefined) {
      host.privateCallRate = Number(privateCallRate);
    }

    if (audioCallRate !== undefined) {
      host.audioCallRate = Number(audioCallRate);
    }

    if (chatRate !== undefined) {
      host.chatRate = Number(chatRate);
    }

    // ================= PROFILE IMAGE =================

    if (req.files?.image?.length > 0) {
      const file = req.files.image[0];



      if (host.image?.key) {
        try {
          await deleteFromS3(host.image.key);
        } catch (error) {
          console.log(
            "⚠️ Old profile image delete failed:",
            error.message
          );
        }
      }

      host.image = {
        url: getMediaUrl(file.key),
        key: file.key,
      };
    }

    // ================= REMOVE PHOTO GALLERY =================

    removePhotos
      .map(Number)
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => b - a);

    for (const index of removePhotos
      .map(Number)
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => b - a)) {

      const item = host.photoGallery?.[index];

      if (!item) continue;

      console.log("🗑️ Removing Gallery:", item.key);

      if (item.key) {
        try {
          await deleteFromS3(item.key);
        } catch (error) {
          console.log(
            "⚠️ Gallery delete failed:",
            error.message
          );
        }
      }

      host.photoGallery.splice(index, 1);
    }

    // ================= ADD PHOTO GALLERY =================

    if (req.files?.photoGallery?.length > 0) {
      const newPhotos = req.files.photoGallery.map((file) => ({
        url: getMediaUrl(file.key),
        key: file.key,
      }));

      host.photoGallery.push(...newPhotos);

      console.log(
        "📸 New Gallery Images:",
        newPhotos.length
      );
    }

    // ================= REMOVE PROFILE VIDEOS =================

    for (const index of removeProfileVideos
      .map(Number)
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => b - a)) {

      const item = host.profileVideo?.[index];

      if (!item) continue;

      console.log("🗑️ Removing Profile Video:", item.key);

      if (item.key) {
        try {
          await deleteFromS3(item.key);
        } catch (error) {
          console.log(
            "⚠️ Profile video delete failed:",
            error.message
          );
        }
      }

      host.profileVideo.splice(index, 1);
    }

    // ================= ADD PROFILE VIDEOS =================

    if (req.files?.profileVideo?.length > 0) {
      const newVideos = req.files.profileVideo.map((file) => ({
        url: getMediaUrl(file.key),
        key: file.key,
      }));

      host.profileVideo.push(...newVideos);

      console.log(
        "🎥 New Profile Videos:",
        newVideos.length
      );
    }

    // ================= SAVE =================

    await host.save();

    console.log("✅ HOST SAVED:", host._id);

    // ================= FRESH DATA =================

    const freshHost = await Host.findById(host._id).lean();

    // ================= RESPONSE =================

    return res.status(200).json({
      status: true,
      message: "Host profile updated successfully",
      host: freshHost,
    });

  } catch (error) {
    console.error("❌ modifyHostDetails error:", error);

    if (req.files) {
      try {
        deleteFiles(req.files);
      } catch (deleteError) {
        console.log(
          "Delete uploaded files error:",
          deleteError.message
        );
      }
    }

    return res.status(500).json({
      status: false,
      message: error.message || "Failed to update host profile",
    });
  }
};


//get host thumblist ( host )
exports.fetchHostsList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "hostId is required." });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Configuration settings not found." });
    }

    if (!req.query.country) {
      return res.status(200).json({ status: false, message: "Please provide a country name." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);
    const country = req.query.country.trim().toLowerCase();
    const isGlobal = country === "global";

    const fakeMatchQuery = isGlobal ? { isFake: true, isBlock: false, _id: { $ne: hostId } } : { country: country, isFake: true, isBlock: false, _id: { $ne: hostId } };
    const matchQuery = isGlobal ? { isFake: false, isBlock: false, status: 2, _id: { $ne: hostId } } : { country: country, isFake: false, isBlock: false, status: 2, _id: { $ne: hostId } };

    const [fakeHost, host, followerList] = await Promise.all([
      Host.aggregate([
        { $match: fakeMatchQuery },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", false] }, { $eq: ["$isBusy", false] }] }, then: "Online" },
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", true] }, { $eq: ["$isBusy", true] }] }, then: "Live" },
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isBusy", true] }] }, then: "Busy" },
                ],
                default: "Offline",
              },
            },
            audioCallRate: 0,
            privateCallRate: 0,
            liveHistoryId: "",
            token: "",
            channel: "",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            countryFlagImage: 1,
            country: 1,
            image: 1,
            audioCallRate: 1,
            privateCallRate: 1,
            isFake: 1,
            status: 1,
            video: 1,
            liveVideo: 1,
            liveHistoryId: 1,
            token: 1,
            channel: 1,
          },
        },
      ]),
      Host.aggregate([
        { $match: matchQuery },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", false] }, { $eq: ["$isBusy", false] }] }, then: "Online" },
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isLive", true] }, { $eq: ["$isBusy", true] }] }, then: "Live" },
                  { case: { $and: [{ $eq: ["$isOnline", true] }, { $eq: ["$isBusy", true] }] }, then: "Busy" },
                ],
                default: "Offline",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            countryFlagImage: 1,
            country: 1,
            image: 1,
            audioCallRate: 1,
            privateCallRate: 1,
            isFake: 1,
            status: 1,
          },
        },
      ]),
      FollowerFollowing.find({ followingId: hostId })
        .populate("followerId", "_id name image uniqueId")
        .sort({ createdAt: -1 })
        .skip((start - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const statusPriority = { Live: 1, Online: 2, Busy: 3, Offline: 4 };

    // Pagination for hosts
    let allHosts = settingJSON.isDemoData ? [...fakeHost, ...host] : host;
    allHosts.sort((a, b) => (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5));
    const paginatedHosts = allHosts.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Hosts list retrieved successfully.",
      hosts: paginatedHosts,
      followerList,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching the hosts list.",
      error: error.message || "Internal Server Error",
    });
  }
};

//delete host
exports.disableHostAccount = async (req, res, next) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(200).json({ status: false, message: "Missing required query parameter: hostId." });
    }

    if (!mongoose.Types.ObjectId.isValid(hostId)) {
      return res.status(200).json({ status: false, message: "Invalid hostId. It must be a valid MongoDB ObjectId." });
    }

    const host = await Host.findOne({ _id: hostId, isFake: false }).lean();
    if (!host) {
      return res.status(200).json({ status: false, message: "host not found." });
    }

    res.status(200).json({
      status: true,
      message: "Host deleted successfully.",
    });

    const [user, chats] = await Promise.all([User.findOne({ hostId }).select("_id").lean(), Chat.find({ senderId: host?._id })]);

    if (user) {
      await User.updateOne({ _id: user._id }, { $set: { isHost: false, hostId: null } });
    }

    for (const chat of chats) {
      deleteFile(chat?.image);
      deleteFile(chat?.audio);
    }

    deleteFile(host?.image);

    if (Array.isArray(host.photoGallery)) {
      for (const imgPath of host.photoGallery) {
        deleteFile(imgPath);
      }
    }

    if (Array.isArray(host.video)) {
      for (const imgPath of host.video) {
        deleteFile(imgPath);
      }
    }

    if (Array.isArray(host.liveVideo)) {
      for (const imgPath of host.liveVideo) {
        deleteFile(imgPath);
      }
    }

    await LiveBroadcastHistory.deleteMany({ hostId: host?._id });
    await Host.deleteOne({ _id: host?._id });
  } catch (error) {
    console.error("Error in disableHostAccount:", error);
    return res.status(500).json({ status: false, message: "An error occurred in disableHostAccount" });
  }
};


