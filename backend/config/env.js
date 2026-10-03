require("dotenv").config();

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const authTokenSecret = process.env.AUTH_TOKEN_SECRET;

if (!authTokenSecret || Buffer.byteLength(authTokenSecret) < 32) {
  throw new Error("AUTH_TOKEN_SECRET must contain at least 32 bytes.");
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === "true",
  corsOrigins,
  authTokenSecret,
};
