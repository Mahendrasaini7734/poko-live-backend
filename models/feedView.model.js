const mongoose = require("mongoose");

const feedViewSchema = new mongoose.Schema(
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

feedViewSchema.index(
  {
    postId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

feedViewSchema.index({
  userId: 1,
});

module.exports = mongoose.model(
  "FeedView",
  feedViewSchema
);