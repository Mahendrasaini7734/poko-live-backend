const mongoose = require("mongoose");

const feedLikeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedPost",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

feedLikeSchema.index(
  {
    postId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

feedLikeSchema.index({
  userId: 1
});

module.exports = mongoose.model(
  "FeedLike",
  feedLikeSchema
);