require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
};

if (!env.mongoUri) {
  throw new Error(
    "Missing MONGODB_URI. Copy server/.env.example to server/.env and fill in a real connection string."
  );
}

if (!env.jwtSecret || !env.jwtRefreshSecret) {
  console.warn(
    "JWT_SECRET / JWT_REFRESH_SECRET are not set — fine for today's DB-only work, but the auth module (day 2) needs both in server/.env."
  );
}

module.exports = env;
