

const express = require("express");

const router = express.Router();

// feed data is business data: never cached by proxies / HTTP caches (no stale likes, comments, deleted posts)
router.use((req, res, next) => {
  if (req.method === "GET") res.set("Cache-Control", "no-store");
  next();
});

const controller = require("../../controllers/client/feed.controller");

const validateUserToken = require("../../middleware/validateUserToken.middleware");

const upload = require("../../middleware/upload");
const checkAccessWithSecretKey = require("../../checkAccess");
const requireHost = require("../../middleware/requireHost.middleware");

// CREATE POST=
router.post(
  "/create",
  validateUserToken,
  checkAccessWithSecretKey(),
  requireHost,
  upload("feed").single("media"),
  controller.createPost
);


// FETCH ALL POSTS

router.get(
  "/fetch",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.fetchPosts
);


// FETCH IMAGE POSTS

router.get(

  "/images",

  validateUserToken,
  checkAccessWithSecretKey(),

  controller.fetchImagePosts

);


// FETCH VIDEO POSTS

router.get(

  "/videos",

  // auth required: without req.user the per-user `isLiked` state was always false
  validateUserToken,
  checkAccessWithSecretKey(),

  controller.fetchVideoPosts

);


// TOGGLE LIKE

router.post(
  "/:id/like",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.toggleLike

);


// SHARE POST

router.post(

  "/:id/share",

  validateUserToken,
  checkAccessWithSecretKey(),

  controller.sharePost

);


// COMMENT POST

router.post(

  "/:id/comment",

  validateUserToken,
  checkAccessWithSecretKey(),

  controller.commentPost

);

// FETCH COMMENTS

router.get(

  "/:id/comments",

  validateUserToken,
  checkAccessWithSecretKey(),

  controller.fetchComments

);

// HOST PROFILE PREVIEW (feed / reels / images — max 6 each + totals) in ONE light request
router.get(
  "/host/:hostId/preview",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.getHostFeedPreview
);

// FETCH  USERS FEED
router.get(
  "/host/:hostId",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.getHostPosts
);


// DELETE COMMENT (author or post owner)
router.delete(
  "/:id/comment/:commentId",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.deleteComment
);

// DELETE OWN POST (host owner only; ownership re-checked in the controller)
router.delete(
  "/:id",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.deleteOwnPost
);

// VIEW COUNT
router.post(
  "/:id/view",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.addPostView
);

// SINGLE POST (viewer reconciliation) — keep LAST so it never shadows fixed paths
router.get(
  "/:id",
  validateUserToken,
  checkAccessWithSecretKey(),
  controller.getPostById
);


// GIFT ON A FEED POST + REPORT A FEED POST
const feedGift = require("../../controllers/client/feedGift.controller");
router.post("/:id/gift", validateUserToken, checkAccessWithSecretKey(), feedGift.sendGift);
router.post("/:id/report", validateUserToken, checkAccessWithSecretKey(), feedGift.reportPost);

module.exports = router;