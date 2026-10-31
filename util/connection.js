// db.js
const mongoose = require("mongoose");

const MONGO_URI = process.env.MongoDb_Connection_String;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error");
  });

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

module.exports = mongoose.connection;
