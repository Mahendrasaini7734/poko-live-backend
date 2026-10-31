const mongoose = require("mongoose");

const feedShareSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

feedShareSchema.index(
  {
    postId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

feedShareSchema.index({
  userId: 1,
});

module.exports = mongoose.model(
  "FeedShare",
  feedShareSchema
);