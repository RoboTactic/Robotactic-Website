const { Pool } = require("pg");

const { databaseUrl, databaseSsl } = require("../config/env");

const pool = new Pool({
  connectionString: databaseUrl,
  ...(databaseSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Idle-client errors can happen after the original request has completed.
// Log only the PostgreSQL error code; never print connection details.
pool.on("error", (error) => {
  console.error("Unexpected idle PostgreSQL client error.", error.code || "unknown");
});

async function connectDatabase() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the API.");
  }

  await pool.query("SELECT 1");
}

module.exports = { pool, connectDatabase };
