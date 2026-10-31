const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    name: {
      type: String,
      default: "Admin",
    },

    imageUrl: {
      type: String,
      default: "",
    },

    imageKey: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Admin", adminSchema);
