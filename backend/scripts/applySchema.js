require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");
const { getDatabaseSslOptions } = require("../config/databaseSsl");

const databaseUrl = process.env.DATABASE_URL;
const schemaPath = path.join(__dirname, "..", "database", "schema.sql");

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Set it in backend/.env first.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ...(process.env.DATABASE_SSL === "true"
    ? { ssl: getDatabaseSslOptions() }
    : {}),
  connectionTimeoutMillis: 5000,
});

async function applySchema() {
  let stage = "reading database/schema.sql";

  try {
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    stage = "connecting to PostgreSQL";
    await client.connect();

    stage = "checking whether the RoboTactic schema already exists";
    const existingSchema = await client.query(
      "SELECT to_regclass('public.admin_users') IS NOT NULL AS initialized",
    );

    if (existingSchema.rows[0].initialized) {
      console.error(
        "RoboTactic schema already exists (public.admin_users was found). No changes were made.",
      );
      process.exitCode = 1;
      return;
    }

    stage = "applying database/schema.sql";
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");

    console.log("RoboTactic schema applied successfully.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (stage === "connecting to PostgreSQL" && error.code === "SELF_SIGNED_CERT_IN_CHAIN") {
      console.error(
        "PostgreSQL TLS verification failed. Download the Supabase CA certificate from Database Settings > SSL Configuration and set DATABASE_SSL_CA_PATH in backend/.env.",
        error.code,
      );
    } else if (stage === "connecting to PostgreSQL" && ["ENOENT", "ENOTFOUND", "EAI_AGAIN"].includes(error.code)) {
      console.error(
        "Could not resolve the PostgreSQL hostname. Copy the connection string from Supabase > Connect and check its host/project reference and DNS/network access.",
        error.code,
      );
    } else if (stage === "reading database/schema.sql") {
      console.error("Could not find backend/database/schema.sql.", error.code || "schema_file_error");
    } else {
      console.error(`Could not apply the RoboTactic schema while ${stage}.`, error.code || "schema_apply_error");
    }
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

applySchema();
