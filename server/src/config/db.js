const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (err) {
    // Fail loud: never let the server start (and silently 500 every request)
    // when it has no real database behind it.
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
