const mongoose = require("mongoose");

const feedPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
      index: true,
    },

    media: [
      {
        url: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
      },
    ],

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    comments: {
      type: Number,
      default: 0,
      min: 0,
    },

    shares: {
      type: Number,
      default: 0,
      min: 0,
    },

    // admin moderation state. archived/blocked also set status=false so the app hides the post
    moderation: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
      index: true,
    },

    status: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

feedPostSchema.index({
  createdAt: -1,
});

feedPostSchema.index({
  type: 1,
  createdAt: -1,
});

feedPostSchema.index({
  userId: 1,
  createdAt: -1,
});

feedPostSchema.index({
  hostId: 1,
  createdAt: -1,
});

// host profile feed / View All (filter + stable sort + pagination)
feedPostSchema.index({
  hostId: 1,
  type: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

feedPostSchema.index({ views: -1, _id: -1 });
feedPostSchema.index({ moderation: 1, createdAt: -1 });

feedPostSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "FeedPost",
  feedPostSchema
);