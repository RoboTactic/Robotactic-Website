require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");
const { getDatabaseSslOptions } = require("../config/databaseSsl");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in backend/.env first.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_SSL === "true" ? { ssl: getDatabaseSslOptions() } : {}),
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    const directory = path.join(__dirname, "..", "database", "migrations");
    for (const name of fs.readdirSync(directory).filter((file) => /^\d+_[\w-]+\.sql$/.test(file)).sort()) {
      const existing = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
      if (existing.rowCount) continue;
      await client.query(fs.readFileSync(path.join(directory, name), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      console.log(`Applied migration ${name}.`);
    }
    await client.query("COMMIT");
    console.log("Database migrations complete.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Could not migrate the database.", error.code || "migration_error");
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

migrate();
