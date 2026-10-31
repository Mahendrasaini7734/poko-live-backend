const mongoose = require("mongoose");

const FeedPost = require("../../models/feedPost.model");
const FeedLike = require("../../models/feedLike.model");
const FeedComment = require("../../models/feedComment.model");
const FeedShare = require("../../models/feedShare.model");
const FeedView = require("../../models/feedView.model");
const Block = require("../../models/block.model");
const {
  FEED_EVENTS,
  emitFeedEvent,
  stampSeq,
} = require("../../services/feedRealtime.service");

const Host = require("../../models/host.model");

const { success, error } = require("../../util/response");
const { deleteFromS3 } = require("../../util/s3Service");

const { getMediaUrl } = require("../../util/media");
const {
  getDisplayName,
} = require("../../util/hostDisplay");



exports.createPost = async (req, res) => {
  try {
    const { caption = "", type } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return error(res, "Unauthorized", 401);
    }

    const hostObj = await Host.findOne({
      userId,
      isBlock: false,
    })
      .select("_id")
      .lean();

    if (!hostObj) {
      return error(res, "Only hosts can create feeds", 403);
    }

    if (!["image", "video"].includes(type)) {
      return error(res, "Invalid post type", 400);
    }

    // upload("feed").single("media") puts the file in req.file
    const uploadedFile = req.file;

    if (!uploadedFile) {
      console.log("MEDIA FILE NOT RECEIVED");
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      return error(res, "Media file required", 400);
    }

    const allowedMimeTypes =
      type === "image"
        ? [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ]
        : [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-m4v",
          ];

    if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
      return error(
        res,
        `Unsupported ${type} file type: ${uploadedFile.mimetype}`,
        400
      );
    }

    const mediaUrl =
      uploadedFile.location ||
      uploadedFile.path ||
      "";

    if (!mediaUrl) {
      console.error("Media URL missing:", {
        fieldname: uploadedFile.fieldname,
        mimetype: uploadedFile.mimetype,
        key: uploadedFile.key,
        path: uploadedFile.path,
        location: uploadedFile.location,
      });

      return error(res, "Media upload URL missing", 500);
    }

    const post = await FeedPost.create({
      userId,
      hostId: hostObj._id,
      caption: String(caption).trim(),
      type,
      media: [
        {
          url: mediaUrl,
          key: uploadedFile.key || "",
        },
      ],
    });

    emitFeedEvent(FEED_EVENTS.CREATED, {
      feedId: post._id,
      hostId: post.hostId,
      userId,
      action: "create",
      updatedCount: 1,
    });

    return success(res, post, "Post created successfully");
  } catch (err) {
    console.error("CREATE POST ERROR:", err);

    if (err instanceof multer.MulterError) {
      return error(res, `Upload error: ${err.message}`, 400);
    }

    return error(
      res,
      err.message || "Internal Server Error",
      500
    );
  }
};





exports.fetchPosts = async (req, res) => {

  try {

    const {

      page = 1,

      limit = 10

    } = req.query;

    const skip =

      (page - 1) * limit;

    // ======================================
    // FETCH POSTS
    // ======================================

    const posts = await FeedPost.find({

      status: true

    })

      .populate({

        path: "userId",

        select: `
        name
        image
        uniqueId
        isVip
      `

      })

      .sort({

        createdAt: -1

      })

      .skip(skip)

      .limit(Number(limit))

      .lean();

    // ======================================
    // TOTAL
    // ======================================

    const total = await FeedPost.countDocuments({

      status: true

    });

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        posts,

        pagination: {

          total,

          page: Number(page),

          totalPages: Math.ceil(

            total / limit

          )

        }

      },

      "Posts fetched successfully"

    );

  } catch (err) {

    console.log(
      "FETCH POSTS ERROR =>",
      err
    );

    return error(
      res,
      err.message,
      500
    );

  }

};

// optional pagination for the main feeds (default: newest 100 -> never an unbounded query)
const feedLimit = (req) =>
  Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 100));
const feedSkip = (req) =>
  (Math.max(1, parseInt(req.query.page, 10) || 1) - 1) * feedLimit(req);

exports.fetchImagePosts = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const posts = await FeedPost.find({
      status: true,
      type: "image",
    })
      .populate({
        path: "userId",
        select: "name image uniqueId isVip",
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(feedSkip(req))
      .limit(feedLimit(req))
      .lean();

    const postIds = posts.map(
      (post) => post._id
    );

    const creatorUserIds = posts
      .map((post) => post.userId?._id)
      .filter(Boolean);

    const [likes, hosts] = await Promise.all([
      userId && postIds.length
        ? FeedLike.find({
          userId,
          postId: {
            $in: postIds,
          },
        }).lean()
        : [],

      creatorUserIds.length
        ? Host.find({
          userId: {
            $in: creatorUserIds,
          },
          isBlock: false,
        })
          .select("_id userId")
          .lean()
        : [],
    ]);

    const likedPostIds = new Set(
      likes.map((like) =>
        like.postId.toString()
      )
    );

    const hostMap = new Map(
      hosts.map((host) => [
        host.userId.toString(),
        host._id,
      ])
    );

    const finalPosts = posts.map((post) => {
      const creatorId =
        post.userId?._id?.toString();

      // FeedPost.hostId is the authoritative owner; the user->host map is only a fallback
      const hostId =
        post.hostId ||
        (creatorId ? hostMap.get(creatorId) : null);

      const postData = {
        ...post,
        isLiked: likedPostIds.has(
          post._id.toString()
        ),
        isHost: Boolean(hostId),
        hostId: hostId || null,
        isFollowing: false,
        isBlocked: false,
      };

      if (postData.userId) {
        postData.userId.image = getMediaUrl(
          postData.userId.image
        );
      }

      if (Array.isArray(postData.media)) {
        postData.media = postData.media.map(
          (media) => ({
            ...media,
            url: getMediaUrl(
              media?.url
            ),
          })
        );
      }

      return postData;
    });

    return success(
      res,
      finalPosts,
      "Image posts fetched successfully"
    );
  } catch (err) {
    console.error(
      "FETCH IMAGE POSTS ERROR =>",
      err.message
    );

    return error(
      res,
      err.message || "Internal Server Error",
      500
    );
  }
};

exports.fetchVideoPosts = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const posts = await FeedPost.find({
      status: true,
      type: "video",
    })
      .populate({
        path: "userId",
        select: "name image uniqueId isVip",
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(feedSkip(req))
      .limit(feedLimit(req))
      .lean();

    const postIds = posts.map(
      (post) => post._id
    );

    const creatorUserIds = posts
      .map((post) => post.userId?._id)
      .filter(Boolean);

    const [likes, hosts] = await Promise.all([
      userId && postIds.length
        ? FeedLike.find({
          userId,
          postId: {
            $in: postIds,
          },
        }).lean()
        : [],

      creatorUserIds.length
        ? Host.find({
          userId: {
            $in: creatorUserIds,
          },
          isBlock: false,
        })
          .select("_id userId")
          .lean()
        : [],
    ]);

    const likedPostIds = new Set(
      likes.map((like) =>
        like.postId.toString()
      )
    );

    const hostMap = new Map(
      hosts.map((host) => [
        host.userId.toString(),
        host._id,
      ])
    );

    const finalPosts = posts.map((post) => {
      const creatorId =
        post.userId?._id?.toString();

      // FeedPost.hostId is the authoritative owner; the user->host map is only a fallback
      const hostId =
        post.hostId ||
        (creatorId ? hostMap.get(creatorId) : null);

      const postData = {
        ...post,
        isLiked: likedPostIds.has(
          post._id.toString()
        ),
        isHost: Boolean(hostId),
        hostId: hostId || null,
        isFollowing: false,
        isBlocked: false,
      };

      if (postData.userId) {
        postData.userId.image = getMediaUrl(
          postData.userId.image
        );
      }

      if (Array.isArray(postData.media)) {
        postData.media = postData.media.map(
          (media) => ({
            ...media,
            url: getMediaUrl(
              media?.url
            ),
          })
        );
      }

      return postData;
    });

    return success(
      res,
      finalPosts,
      "Video posts fetched successfully"
    );
  } catch (err) {
    console.error(
      "FETCH VIDEO POSTS ERROR =>",
      err.message
    );

    return error(
      res,
      err.message || "Internal Server Error",
      500
    );
  }
};

// =====================================================================
// SHARED HELPERS (like / comment / view / share / host feed)
// =====================================================================

const isObjectId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id.toLowerCase();

/** loads an *available* post or returns null (deleted / hidden / invalid id) */
const loadActivePost = (postId, select = "_id hostId userId likes comments views shares") =>
  isObjectId(postId)
    ? FeedPost.findOne({ _id: postId, status: true }).select(select).lean()
    : null;

/** true when the host and the user blocked each other (either direction) */
const isBlockedPair = async (userId, hostId) => {
  if (!userId || !hostId) return false;
  const blocked = await Block.findOne({
    userId,
    hostId,
    $or: [
      { blockedBy: "user", blockedType: "host" },
      { blockedBy: "host", blockedType: "user" },
    ],
  })
    .select("_id")
    .lean();
  return Boolean(blocked);
};

// tiny in-memory throttle: max N hits per window per key (per node process)
const hits = new Map();
const throttled = (key, max, windowMs) => {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 20000) {
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  }
  return false;
};

const formatPostMedia = (post) => {
  if (Array.isArray(post.media)) {
    post.media = post.media.map((m) => ({ ...m, url: getMediaUrl(m?.url) }));
  }
  return post;
};

// =====================================================================
// LIKE  (idempotent: client may send { liked: true|false } = desired state)
// =====================================================================
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId)) return error(res, "Invalid postId");

    const post = await loadActivePost(postId, "_id hostId likes");
    if (!post) return error(res, "Post not found", 404);

    if (await isBlockedPair(userId, post.hostId)) {
      return error(res, "You cannot interact with this post", 403);
    }

    if (throttled(`like:${userId}`, 30, 10000)) {
      return error(res, "Too many requests", 429);
    }

    const desired =
      typeof req.body?.liked === "boolean" ? req.body.liked : null;

    const existing = await FeedLike.findOne({ postId, userId }).select("_id").lean();
    const target = desired === null ? !existing : desired;

    let delta = 0;

    if (target && !existing) {
      try {
        await FeedLike.create({ postId, userId });
        delta = 1;
      } catch (err) {
        if (err.code !== 11000) throw err; // concurrent duplicate -> already liked
      }
    } else if (!target && existing) {
      const removed = await FeedLike.findOneAndDelete({ _id: existing._id }).select("_id").lean();
      if (removed) delta = -1;
    }

    let likes = Number(post.likes || 0);

    if (delta !== 0) {
      const updated = await FeedPost.findByIdAndUpdate(
        postId,
        { $inc: { likes: delta } },
        { new: true }
      )
        .select("likes")
        .lean();
      likes = Math.max(0, Number(updated?.likes || 0));

      if (likes === 0 && updated && updated.likes < 0) {
        await FeedPost.updateOne({ _id: postId }, { $set: { likes: 0 } });
      }
    } else {
      const fresh = await FeedPost.findById(postId).select("likes").lean();
      likes = Math.max(0, Number(fresh?.likes || 0));
    }

    const seq = stampSeq();

    if (delta !== 0) {
      emitFeedEvent(target ? FEED_EVENTS.LIKED : FEED_EVENTS.UNLIKED, {
        seq,
        feedId: postId,
        hostId: post.hostId,
        userId,
        action: target ? "like" : "unlike",
        updatedCount: likes,
      });
    }

    return success(
      res,
      { liked: target, likes, seq, changed: delta !== 0 },
      target ? "Post liked" : "Post unliked"
    );
  } catch (err) {
    console.error("TOGGLE LIKE ERROR =>", err);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

// =====================================================================
// SHARE
// =====================================================================
exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId)) return error(res, "Invalid postId");

    const post = await loadActivePost(postId, "_id hostId shares");
    if (!post) return error(res, "Post not found", 404);

    if (throttled(`share:${userId}`, 20, 10000)) {
      return error(res, "Too many requests", 429);
    }

    try {
      await FeedShare.create({ postId, userId });
    } catch (err) {
      if (err.code === 11000) {
        return success(
          res,
          { shares: Number(post.shares || 0), seq: stampSeq(), counted: false },
          "Post already shared"
        );
      }
      throw err;
    }

    const updated = await FeedPost.findByIdAndUpdate(
      postId,
      { $inc: { shares: 1 } },
      { new: true }
    )
      .select("shares")
      .lean();

    const shares = Number(updated?.shares || 0);

    const seq = stampSeq();

    emitFeedEvent(FEED_EVENTS.SHARED, {
      seq,
      feedId: postId,
      hostId: post.hostId,
      userId,
      action: "share",
      updatedCount: shares,
    });

    return success(res, { shares, seq, counted: true }, "Post shared successfully");
  } catch (err) {
    console.error("SHARE POST ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

// =====================================================================
// COMMENTS
// =====================================================================
const COMMENT_USER_SELECT = "name image uniqueId isVip";

const formatComment = (c) => {
  if (c?.userId && typeof c.userId === "object" && c.userId.image) {
    c.userId.image = getMediaUrl(c.userId.image);
  }
  return c;
};

exports.commentPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId)) return error(res, "Invalid postId");

    const text =
      typeof req.body?.comment === "string" ? req.body.comment.trim() : "";

    if (!text) return error(res, "comment is required");
    if (text.length > 500) return error(res, "comment is too long (max 500)");

    const post = await loadActivePost(postId, "_id hostId comments");
    if (!post) return error(res, "Post not found", 404);

    if (await isBlockedPair(userId, post.hostId)) {
      return error(res, "You cannot interact with this post", 403);
    }

    if (throttled(`comment:${userId}`, 6, 10000)) {
      return error(res, "You are commenting too fast", 429);
    }

    const created = await FeedComment.create({ postId, userId, comment: text });

    const updated = await FeedPost.findByIdAndUpdate(
      postId,
      { $inc: { comments: 1 } },
      { new: true }
    )
      .select("comments")
      .lean();

    const commentsCount = Number(updated?.comments || 0);

    const populated = formatComment(
      await FeedComment.findById(created._id)
        .populate({ path: "userId", select: COMMENT_USER_SELECT })
        .lean()
    );

    const seq = stampSeq();

    emitFeedEvent(FEED_EVENTS.COMMENT_ADDED, {
      seq,
      feedId: postId,
      hostId: post.hostId,
      userId,
      action: "comment_add",
      updatedCount: commentsCount,
      commentId: String(created._id),
      comment: populated,
    });

    // `data` keeps the comment document shape (backward compatible) + authoritative count
    return success(
      res,
      { ...populated, commentsCount, seq },
      "Comment added successfully"
    );
  } catch (err) {
    console.error("COMMENT POST ERROR =>", err);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId) || !isObjectId(commentId)) {
      return error(res, "Invalid id");
    }

    const comment = await FeedComment.findOne({ _id: commentId, postId })
      .select("_id userId")
      .lean();
    if (!comment) return error(res, "Comment not found", 404);

    const post = await FeedPost.findById(postId).select("_id hostId userId comments").lean();
    if (!post) return error(res, "Post not found", 404);

    // only the comment author or the post owner (host) can delete
    const isAuthor = String(comment.userId) === String(userId);
    const isPostOwner = String(post.userId) === String(userId);
    if (!isAuthor && !isPostOwner) {
      return error(res, "Not allowed to delete this comment", 403);
    }

    const removed = await FeedComment.findOneAndDelete({ _id: commentId }).select("_id").lean();

    let commentsCount = Number(post.comments || 0);
    if (removed) {
      const updated = await FeedPost.findByIdAndUpdate(
        postId,
        { $inc: { comments: -1 } },
        { new: true }
      )
        .select("comments")
        .lean();
      commentsCount = Math.max(0, Number(updated?.comments || 0));
      if (updated && updated.comments < 0) {
        await FeedPost.updateOne({ _id: postId }, { $set: { comments: 0 } });
      }

      emitFeedEvent(FEED_EVENTS.COMMENT_DELETED, {
        seq: stampSeq(),
        feedId: postId,
        hostId: post.hostId,
        userId,
        action: "comment_delete",
        updatedCount: commentsCount,
        commentId,
      });
    }

    return success(res, { commentsCount, deleted: Boolean(removed) }, "Comment deleted");
  } catch (err) {
    console.error("DELETE COMMENT ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

exports.fetchComments = async (req, res) => {
  try {
    const postId = req.params.id;

    if (!isObjectId(postId)) return error(res, "Invalid postId");

    const post = await loadActivePost(postId, "_id comments");
    if (!post) return error(res, "Post not found", 404);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      FeedComment.find({ postId })
        .populate({ path: "userId", select: COMMENT_USER_SELECT })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedComment.countDocuments({ postId }),
    ]);

    return success(
      res,
      {
        comments: comments.map(formatComment),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
        },
        commentsCount: Number(post.comments || 0),
      },
      "Comments fetched successfully"
    );
  } catch (err) {
    console.error("FETCH COMMENTS ERROR =>", err);
    return error(res, err.message, 500);
  }
};

// =====================================================================
// HOST FEED (profile preview + View All)  — strictly isolated by hostId
// =====================================================================
const HOST_CARD_SELECT =
  "name image gender country countryFlagImage uniqueId isOnline isLive isFake";

const loadHostCard = (hostId) =>
  Host.findOne({ _id: hostId, isBlock: false }).select(HOST_CARD_SELECT).lean();

/**
 * Shapes posts for host profile / View All / viewer.
 * The host is loaded ONCE by the caller (no per-post populate/join) and attached to every post.
 */
const buildHostPostPayload = async (posts, currentUserId, hostDoc = null) => {
  const postIds = posts.map((p) => p._id);
  let likedSet = new Set();
  let commentedSet = new Set();

  if (currentUserId && postIds.length > 0) {
    // both lookups are served by the (postId,userId) indexes; run in parallel
    const [likes, comments] = await Promise.all([
      FeedLike.find({ postId: { $in: postIds }, userId: currentUserId }).select("postId").lean(),
      FeedComment.find({ postId: { $in: postIds }, userId: currentUserId }).select("postId").lean(),
    ]);
    likedSet = new Set(likes.map((i) => String(i.postId)));
    commentedSet = new Set(comments.map((i) => String(i.postId)));
  }

  const hostPayload = hostDoc
    ? {
        ...hostDoc,
        image: hostDoc.image ? getMediaUrl(hostDoc.image) : hostDoc.image,
        displayName: getDisplayName(hostDoc.name, hostDoc._id),
      }
    : null;

  return posts.map((post) => {
    const id = String(post._id);
    formatPostMedia(post);

    return {
      ...post,
      hostId: hostPayload || post.hostId || null,
      views: Number(post.views || 0),
      likes: Number(post.likes || 0),
      comments: Number(post.comments || 0),
      shares: Number(post.shares || 0),
      hasLiked: likedSet.has(id),
      hasCommented: commentedSet.has(id),
      // counts are always the real backend counts
      showFakeData: false,
      fakeData: null,
    };
  });
};
exports.buildHostPostPayload = buildHostPostPayload;

/** counts of a host's active posts by type in ONE indexed aggregate */
const getHostFeedCounts = async (hostId) => {
  const rows = await FeedPost.aggregate([
    { $match: { hostId: new mongoose.Types.ObjectId(String(hostId)), status: true } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const images = rows.find((r) => r._id === "image")?.count || 0;
  const reels = rows.find((r) => r._id === "video")?.count || 0;
  return { feed: images + reels, images, reels };
};
exports.getHostFeedCounts = getHostFeedCounts;

const POST_LIST_SELECT = "hostId userId caption type media views likes comments shares status createdAt updatedAt";

exports.getHostPosts = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { type = "all", page = 1, limit = 12 } = req.query;
    const currentUserId = req.user?.userId;

    if (!isObjectId(hostId)) return error(res, "Invalid hostId");
    if (!["image", "video", "all"].includes(type)) return error(res, "Invalid post type");

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (currentPage - 1) * perPage;

    const filter = { hostId, status: true };
    if (type !== "all") filter.type = type;

    // optional stable-pagination anchor: ignore posts created after the first page was loaded
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!isNaN(before.getTime())) filter.createdAt = { $lte: before };
    }

    const [host, posts, total] = await Promise.all([
      loadHostCard(hostId),
      FeedPost.find(filter)
        .select(POST_LIST_SELECT)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      FeedPost.countDocuments(filter),
    ]);

    if (!host) return error(res, "Host not found", 404);

    const formatted = await buildHostPostPayload(posts, currentUserId, host);
    const totalPages = Math.ceil(total / perPage);

    res.set("Cache-Control", "no-store");
    return success(
      res,
      {
        posts: formatted,
        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      },
      "Host posts fetched successfully"
    );
  } catch (err) {
    console.error("GET HOST POSTS ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

const PREVIEW_LIMIT = 6;

/**
 * Host profile preview: feed (any type) + reels (video) + images — max 6 each, plus totals,
 * so the app knows which sections to render and whether "View All" is needed (total > 6).
 * One request, 5 parallel indexed queries, no N+1.
 */
exports.getHostFeedPreview = async (req, res) => {
  try {
    const { hostId } = req.params;
    const currentUserId = req.user?.userId;

    if (!isObjectId(hostId)) return error(res, "Invalid hostId");

    const base = { hostId, status: true };
    const latest = (extra = {}) =>
      FeedPost.find({ ...base, ...extra })
        .select(POST_LIST_SELECT)
        .sort({ createdAt: -1, _id: -1 })
        .limit(PREVIEW_LIMIT)
        .lean();

    const [host, counts, feed, reels, images] = await Promise.all([
      loadHostCard(hostId),
      getHostFeedCounts(hostId),
      latest(),
      latest({ type: "video" }),
      latest({ type: "image" }),
    ]);

    if (!host) return error(res, "Host not found", 404);

    // the three lists overlap -> shape the union ONCE (one likes/comments lookup)
    const unique = new Map();
    [...feed, ...reels, ...images].forEach((p) => unique.set(String(p._id), p));
    const shapedList = await buildHostPostPayload([...unique.values()], currentUserId, host);
    const shaped = new Map(shapedList.map((p) => [String(p._id), p]));
    const pick = (list) => list.map((p) => shaped.get(String(p._id)));

    res.set("Cache-Control", "no-store");
    return success(
      res,
      {
        limit: PREVIEW_LIMIT,
        counts,
        feed: { items: pick(feed), total: counts.feed, hasMore: counts.feed > PREVIEW_LIMIT },
        reels: { items: pick(reels), total: counts.reels, hasMore: counts.reels > PREVIEW_LIMIT },
        images: { items: pick(images), total: counts.images, hasMore: counts.images > PREVIEW_LIMIT },
      },
      "Host feed preview fetched successfully"
    );
  } catch (err) {
    console.error("GET HOST FEED PREVIEW ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

/** single post (viewer reconciliation: deleted/unavailable -> 404 + available:false) */
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    if (!isObjectId(id)) return error(res, "Invalid postId");

    const post = await FeedPost.findOne({ _id: id, status: true })
      .select(POST_LIST_SELECT)
      .lean();

    if (!post) {
      return res.status(404).json({ status: false, available: false, message: "Post not found" });
    }

    const host = await loadHostCard(post.hostId);
    const [formatted] = await buildHostPostPayload([post], currentUserId, host);
    return success(res, { post: formatted, available: true }, "Post fetched successfully");
  } catch (err) {
    console.error("GET POST ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};

// =====================================================================
// VIEW  (unique per user per post — enforced by unique index)
// =====================================================================
exports.addPostView = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId)) return error(res, "Invalid postId");

    const post = await loadActivePost(postId, "_id hostId views");
    if (!post) return error(res, "Post not found", 404);

    if (throttled(`view:${userId}`, 60, 10000)) {
      return success(res, { views: Number(post.views || 0), seq: stampSeq(), counted: false }, "Rate limited");
    }

    try {
      await FeedView.create({ postId, userId });
    } catch (err) {
      if (err.code === 11000) {
        return success(res, { views: Number(post.views || 0), seq: stampSeq(), counted: false }, "View already counted");
      }
      throw err;
    }

    const updated = await FeedPost.findByIdAndUpdate(
      postId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .select("views")
      .lean();

    const views = Number(updated?.views || 0);

    const seq = stampSeq();

    emitFeedEvent(FEED_EVENTS.VIEW_UPDATED, {
      seq,
      feedId: postId,
      hostId: post.hostId,
      userId,
      action: "view",
      updatedCount: views,
    });

    return success(res, { views, seq, counted: true }, "View counted successfully");
  } catch (err) {
    console.error("ADD POST VIEW ERROR =>", err.message);
    return error(res, err.message || "Internal Server Error", 500);
  }
};


/**
 * DELETE /feed/:id - a host deletes ONE of their own posts.
 * Authorization is enforced here (not only in the UI): the caller must be the authenticated owner
 * (post.userId) AND the host the post belongs to (post.hostId). Gift/coin History rows that reference the
 * post are financial records and are intentionally kept.
 */
exports.deleteOwnPost = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.id;
    if (!userId) return error(res, "Unauthorized", 401);
    if (!isObjectId(postId)) return error(res, "Invalid post id", 400);

    const post = await FeedPost.findById(postId).select("_id userId hostId media").lean();
    if (!post) return error(res, "Post not found", 404);

    const host = await Host.findOne({ userId }).select("_id").lean();
    const owns = String(post.userId) === String(userId) && host && String(host._id) === String(post.hostId);
    if (!owns) return error(res, "You can only delete your own posts", 403);

    // delete the post only if it still belongs to the caller (guards a race with ownership changes)
    const removed = await FeedPost.findOneAndDelete({ _id: post._id, userId, hostId: host._id }).select("_id").lean();
    if (!removed) return error(res, "Post not found", 404);

    // related records of this post
    await Promise.all([
      FeedLike.deleteMany({ postId: post._id }),
      FeedComment.deleteMany({ postId: post._id }),
      FeedShare.deleteMany({ postId: post._id }),
      FeedView.deleteMany({ postId: post._id }),
    ]);

    // storage cleanup is best effort: a failed S3 delete must not resurrect or block the deletion
    for (const m of post.media || []) {
      if (m?.key) deleteFromS3(m.key).catch((e) => console.error("DELETE POST MEDIA ERROR:", m.key, e.message));
    }

    emitFeedEvent(FEED_EVENTS.DELETED, {
      feedId: String(post._id),
      hostId: post.hostId,
      action: "delete",
      updatedCount: 0,
    });

    return success(res, { postId: String(post._id) }, "Post deleted successfully");
  } catch (err) {
    console.error("DELETE OWN POST ERROR:", err);
    return error(res, "Internal Server Error", 500);
  }
};
