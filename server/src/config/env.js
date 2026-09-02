require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  webhookSecret: process.env.WEBHOOK_SECRET,
};

if (!env.mongoUri) {
  throw new Error(
    "Missing MONGODB_URI. Copy server/.env.example to server/.env and fill in a real connection string."
  );
}

if (!env.jwtSecret || !env.jwtRefreshSecret) {
  console.warn(
    "JWT_SECRET / JWT_REFRESH_SECRET are not set — the identity module (auth, OTP, sessions) needs both in server/.env."
  );
}

if (!env.webhookSecret) {
  console.warn(
    "WEBHOOK_SECRET is not set — the booking module's mock payment gateway/webhook can't sign or verify until it's in server/.env."
  );
}

module.exports = env;
