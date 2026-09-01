// Run with: npm run seed:policy
// Creates the Policy singleton if it doesn't exist yet and prints it, so you
// can confirm the DB connection and the model both work before building on
// top of them.
const connectDB = require("../config/db");
const Policy = require("../models/Policy");
const mongoose = require("mongoose");

async function seed() {
  await connectDB();
  const policy = await Policy.getSingleton();
  console.log("Policy singleton ready:");
  console.log(policy.toObject());
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Policy seed failed:", err);
  process.exit(1);
});
