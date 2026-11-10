const fs = require("node:fs");
const path = require("node:path");

// pg lets SSL query parameters replace the explicit ssl object. Normalize them
// first so hosted PostgreSQL always verifies both the certificate and hostname.
function getDatabaseConnectionOptions(connectionString, { requireTls = false } = {}) {
  let url;
  try { url = new URL(connectionString); }
  catch { throw new Error("Configure a valid PostgreSQL URL privately."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("A PostgreSQL URL is required.");
  const hosted = url.hostname.endsWith(".neon.tech") || /\.supabase\.(co|com)$/.test(url.hostname);
  const mode = url.searchParams.get("sslmode");
  const useTls = requireTls || hosted || process.env.NODE_ENV === "production"
    || process.env.DATABASE_SSL === "true"
    || (mode && mode !== "disable") || ["1", "true"].includes(url.searchParams.get("ssl"));
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "sslnegotiation", "uselibpqcompat"]) url.searchParams.delete(key);
  if (!useTls) return { connectionString: url.toString() };
  const caPath = process.env.DATABASE_SSL_CA_PATH;
  let ca;
  if (caPath) {
    try { ca = fs.readFileSync(path.resolve(caPath), "utf8"); }
    catch { throw new Error("DATABASE_SSL_CA_PATH must point to a readable CA certificate file."); }
  }
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) }, enableChannelBinding: true };
}

module.exports = { getDatabaseConnectionOptions };
