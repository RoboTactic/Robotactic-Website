const fs = require("node:fs");
const path = require("node:path");

function getDatabaseSslOptions() {
  if (process.env.DATABASE_SSL !== "true") return undefined;

  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (!caPath) return { rejectUnauthorized: true };

  try {
    return {
      ca: fs.readFileSync(path.resolve(caPath), "utf8"),
      rejectUnauthorized: true,
    };
  } catch {
    throw new Error("DATABASE_SSL_CA_PATH must point to a readable CA certificate file.");
  }
}

module.exports = { getDatabaseSslOptions };
