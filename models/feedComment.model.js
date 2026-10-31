const mongoose = require("mongoose");

const feedCommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedPost",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

feedCommentSchema.index({
  postId: 1,
  createdAt: -1,
  _id: -1,
});

feedCommentSchema.index({
  userId: 1,
});

// "did this user comment on these posts" (host feed hasCommented lookup)
feedCommentSchema.index({
  postId: 1,
  userId: 1,
});

module.exports = mongoose.model(
  "FeedComment",
  feedCommentSchema
);