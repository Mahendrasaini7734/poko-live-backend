const FollowerFollowing = require("../../models/followerFollowing.model");

//import model
const User = require("../../models/user.model");
const Host = require("../../models/host.model");
const Block = require("../../models/block.model");

//mongoose
const mongoose = require("mongoose");

//private key
const firebase = require("../../util/privateKey");
//follow or unfollow
exports.handleFollowUnfollow = async (req, res) => {
  try {

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    if (!req.query.followingId) {
      return res.status(200).json({
        status: false,
        message: "Invalid request. followingId is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.query.followingId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid followingId.",
      });
    }

    const currentUserId = new mongoose.Types.ObjectId(
      req.user.userId
    );

    const followingHostId = new mongoose.Types.ObjectId(
      req.query.followingId
    );


    const [user, followerHost, followingHost] = await Promise.all([
      User.findOne({
        _id: currentUserId,
        isBlock: false,
      })
        .select("_id name image isHost hostId")
        .lean(),

      Host.findOne({
        userId: currentUserId,
        isBlock: false,
      })
        .select("_id userId name")
        .lean(),

      Host.findOne({
        _id: followingHostId,
        isBlock: false,
      })
        .select("_id userId name fcmToken isBlock")
        .lean(),
    ]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (!followingHost) {
      return res.status(200).json({
        status: false,
        message: "Host not found.",
      });
    }
    const followerId = currentUserId;

    const followerType = followerHost ? "host" : "user";

    console.log("======================================");
    console.log("FOLLOW / UNFOLLOW");
    console.log("Follower Type :", followerType);
    console.log("Follower User :", followerId.toString());
    console.log("Follower Host :", followerHost?._id?.toString());
    console.log(
      "Following Host:",
      followingHost._id.toString()
    );
    console.log("======================================");

    // =====================================================
    // SELF FOLLOW CHECK
    // =====================================================

    if (
      followerHost &&
      followerHost._id.equals(followingHost._id)
    ) {
      return res.status(200).json({
        status: false,
        message: "You can't follow your own account.",
      });
    }

    // =====================================================
    // BLOCK CHECK
    // =====================================================

    const isBlocked = await Block.findOne({
      $or: [
        {
          userId: followerId,
          hostId: followingHost._id,
        },
        {
          userId: followingHost.userId,
          hostId: followerHost?._id,
        },
      ],
    })
      .select("_id")
      .lean();

    if (isBlocked) {
      return res.status(403).json({
        status: false,
        message: "You have blocked this host. Unblock to follow.",
      });
    }

    // =====================================================
    // EXISTING FOLLOW
    // =====================================================

    const existingFollow =
      await FollowerFollowing.findOne({
        followerId: followerId,
        followingId: followingHost._id,
      })
        .select("_id")
        .lean();

    console.log(
      "Existing Follow:",
      existingFollow
    );

    // =====================================================
    // UNFOLLOW
    // =====================================================

    if (existingFollow) {
      await FollowerFollowing.deleteOne({
        _id: existingFollow._id,
      });

      console.log("❌ UNFOLLOWED");

      return res.status(200).json({
        status: true,
        message: "Unfollowed successfully.",
        isFollow: false,
      });
    }

    // =====================================================
    // FOLLOW
    // =====================================================

    await FollowerFollowing.create({
      followerId: followerId,
      followingId: followingHost._id,
    });

    console.log("✅ FOLLOW CREATED");

    // =====================================================
    // RESPONSE
    // =====================================================

    const [followersCount, followingCount] =
      await Promise.all([
        FollowerFollowing.countDocuments({
          followingId: followingHost._id,
        }),

        FollowerFollowing.countDocuments({
          followerId: followerId,
        }),
      ]);

    // =====================================================
    // SEND RESPONSE FIRST
    // =====================================================

    res.status(200).json({
      status: true,
      message: "Followed successfully.",
      isFollow: true,
      followersCount,
      followingCount,
    });

    // =====================================================
    // FCM
    // =====================================================

  if (followingHost.fcmToken) {
  const followerName =
    followerType === "host"
      ? followerHost?.name || "Host"
      : user.name || "User";

  const notificationTitle =
    followerType === "host"
      ? "🌟 New Host Follower! 👤✨"
      : "🌟 New Follower Alert! 👤✨";

  const notificationBody =
    followerType === "host"
      ? `${followerName} 🚀 started following you!`
      : `${followerName} 🚀 started following you!`;

  const payload = {
    token: followingHost.fcmToken,

    data: {
      title: notificationTitle,

      body: notificationBody,

      type: "FOLLOW",

      followerId:
        String(followerId),

      followerName:
        String(followerName),

      followingId:
        String(followingHost._id),

      followerRole:
        followerType,

      isFakeSender: "false",
    },
  };

  try {
    const response =
      await firebase.messaging.send(
        payload
      );

    console.log(
      "✅ FOLLOW NOTIFICATION SENT =>",
      {
        followerId:
          String(followerId),

        followerName:
          followerName,

        followingHostId:
          String(followingHost._id),

        followerRole:
          followerType,

        response,
      }
    );
  } catch (error) {
    console.log(
      "❌ FOLLOW NOTIFICATION ERROR =>",
      error.message
    );
  }
}
  } catch (error) {
    console.error(
      "❌ handleFollowUnfollow Error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message || "Internal Server Error",
    });
  }
};

//get list of following
exports.getFollowingList = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [user, followingList] = await Promise.all([
      User.findById(userId).select("_id").lean(),
      FollowerFollowing.find({ followerId: userId }).populate("followingId", "_id name image").sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(403).json({ status: false, message: "User is blocked." });

    res.status(200).json({
      status: true,
      message: `Retrieved following users successfully.`,
      followingList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get list of followers
exports.getFollowerList = async (req, res) => {
  try {
    if (!req.query.hostId) {
      return res.status(200).json({ status: false, message: "hostId is required." });
    }

    const hostId = new mongoose.Types.ObjectId(req.query.hostId);

    const [host, followerList] = await Promise.all([
      Host.findById(hostId).select("_id isBlock").lean(),
      FollowerFollowing.find({ followingId: hostId }).populate("followerId", "_id name image").sort({ createdAt: -1 }).lean(),
    ]);

    if (!host) return res.status(200).json({ status: false, message: "Host not found." });
    if (host.isBlock) return res.status(403).json({ status: false, message: "Host is blocked." });

    res.status(200).json({
      status: true,
      message: `Retrieved followers successfully.`,
      followerList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
