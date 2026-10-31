const mongoose = require("mongoose");

const { MESSAGE_TYPE, CALL_TYPE } = require("../types/constant");
const s3FileSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    key: { type: String, default: "" },
  },
  { _id: false }
);
const chatSchema = mongoose.Schema(
  {
    chatTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatTopic",
      default: null,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    messageType: {
      type: Number,
      enum: MESSAGE_TYPE,
    },

    message: {
      type: String,
      default: "",
    },

    // Image
    image: {
      type: s3FileSchema,
      default: () => ({ url: "", key: "" }),
    },

    // Audio
    audio: {
      type: s3FileSchema,
      default: () => ({ url: "", key: "" }),
    },

    giftType: {
      type: Number,
      default: 0,
    },

    giftCount: {
      type: Number,
      default: 0,
    },

    // Gift Image
    giftImage: {
      type: s3FileSchema,
      default: () => ({ url: "", key: "" }),
    },

    // Gift SVGA
    giftsvgaImage: {
      type: s3FileSchema,
      default: () => ({ url: "", key: "" }),
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    callId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    callType: {
      type: Number,
      enum: CALL_TYPE,
    },

    callDuration: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatSchema.index({ chatTopicId: 1 });
chatSchema.index({ senderId: 1 });

module.exports = mongoose.model("Chat", chatSchema);
