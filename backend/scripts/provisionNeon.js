// Manual, approved deployment step. Never invoked by build/deploy hooks.
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes, pbkdf2Sync, createHmac, createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { Client, escapeLiteral } = require("pg");
const { getDatabaseConnectionOptions } = require("../config/databaseSsl");
const { auditRuntimeRole } = require("./auditRuntimeRole");
const { buildNeonInitialization } = require("./prepareNeonDatabase");
const { hashPassword } = require("../utils/passwords");
const root = path.resolve(__dirname, "../..");

function savePrivate(name, value) {
  const relative = `backend/${name}.secrets.json`;
  const ignored = spawnSync("git", ["check-ignore", "--quiet", "--", relative], { cwd: root, windowsHide: true });
  if (ignored.status !== 0) throw new Error("Secret file must be ignored by Git.");
  const filename = path.join(root, relative);
  fs.writeFileSync(filename, JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
}

function scramVerifier(password) {
  const salt = randomBytes(24);
  const salted = pbkdf2Sync(password, salt, 4096, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const storedKey = createHash("sha256").update(clientKey).digest("base64");
  const serverKey = createHmac("sha256", salted).update("Server Key").digest("base64");
  return `SCRAM-SHA-256$4096:${salt.toString("base64")}$${storedKey}:${serverKey}`;
}

async function main() {
  if (process.argv.slice(2).join(" ") !== "--apply") throw new Error("Explicit --apply is required.");
  require("dotenv").config({ path: path.join(root, "backend/.env") });
  const owner = new URL(process.env.DATABASE_URL);
  if (!owner.hostname.endsWith(".neon.tech")) throw new Error("Neon configuration required.");
  // Use the same Neon endpoint without the pooled alias for administration.
  owner.hostname = owner.hostname.replace("-pooler.", ".");
  const admin = new Client({ ...getDatabaseConnectionOptions(owner.toString(), { requireTls: true }), connectionTimeoutMillis: 15000 });
  admin.on("error", () => {});
  let runtime;
  try {
    await admin.connect();
    const sql = buildNeonInitialization();
    if (sql !== fs.readFileSync(path.join(root, "backend/database/neon-initialize.sql"), "utf8")) throw new Error("Reviewed SQL must be regenerated and tested first.");
    const runtimeFile = path.join(root, "backend/neon-runtime.secrets.json");
    if (!fs.existsSync(runtimeFile)) await admin.query(sql); // Atomic empty-Neon guard.
    const beforeLogin = await auditRuntimeRole(admin, { verify: true });
    if (!beforeLogin.verified) throw new Error("Runtime privileges did not pass review.");
    console.log(JSON.stringify({ stage: "schema_and_permissions", verified: true, plannedOperations: beforeLogin.plansChecked }));

    let runtimeUrl;
    if (fs.existsSync(runtimeFile)) {
      runtimeUrl = new URL(JSON.parse(fs.readFileSync(runtimeFile, "utf8")).DATABASE_URL);
      if (runtimeUrl.username !== "robotactic_app" || runtimeUrl.hostname !== owner.hostname
        || runtimeUrl.pathname !== owner.pathname || decodeURIComponent(runtimeUrl.password).length < 32) throw new Error("Unexpected saved runtime credentials.");
    } else {
      runtimeUrl = new URL(owner);
      runtimeUrl.username = "robotactic_app";
      runtimeUrl.password = randomBytes(36).toString("base64url");
      savePrivate("neon-runtime", { DATABASE_URL: runtimeUrl.toString() });
    }
    // Neon requires the password itself over TLS. Keep it out of SQL text and
    // ordinary/error parameter logs. The temporary function is session-local.
    const logging = (await admin.query("SELECT name,setting FROM pg_settings WHERE name IN ('log_statement','log_min_duration_statement','log_parameter_max_length_on_error','pgaudit.log')")).rows;
    const settings = Object.fromEntries(logging.map(row => [row.name,row.setting]));
    if (settings.log_statement !== "none" || settings.log_min_duration_statement !== "-1"
      || settings.log_parameter_max_length_on_error !== "0" || (settings["pgaudit.log"] && settings["pgaudit.log"] !== "none")) throw new Error("Password activation requires private parameter logging settings.");
    await admin.query(`CREATE OR REPLACE FUNCTION pg_temp.activate_runtime_role(value text) RETURNS void LANGUAGE plpgsql AS $function$
      BEGIN
        EXECUTE format('ALTER ROLE robotactic_app PASSWORD %L LOGIN',value);
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='Runtime activation failed.';
      END
      $function$`);
    await admin.query("SELECT pg_temp.activate_runtime_role($1)", [decodeURIComponent(runtimeUrl.password)]);
    runtime = new Client({ ...getDatabaseConnectionOptions(runtimeUrl.toString(), { requireTls: true }), connectionTimeoutMillis: 15000 });
    runtime.on("error", () => {});
    await runtime.connect();
    const afterLogin = await auditRuntimeRole(runtime, { verify: true, runtimeLogin: true });
    if (!afterLogin.verified || !afterLogin.passwordLoginVerified) throw new Error("Runtime TLS login or privileges did not pass.");
    console.log(JSON.stringify({ stage: "runtime_login", verified: true, passwordLoginVerified: true, clientTls: afterLogin.session.client_tls }));

    const existing = await runtime.query("SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE role_code='super_admin' AND is_active=true) AS present");
    if (!existing.rows[0].present) {
      const adminPassword = randomBytes(30).toString("base64url");
      savePrivate("initial-admin", { login_name: "admin", password: adminPassword });
      await runtime.query(`INSERT INTO public.admin_users(full_name,login_name,role_code,password_hash)
        VALUES ($1,$2,$3,$4)`, ["RoboTactic Admin", "admin", "super_admin", await hashPassword(adminPassword)]);
      console.log(JSON.stringify({ stage: "site_admin", created: true, credentialFile: "backend/initial-admin.secrets.json" }));
    }
  } finally {
    if (runtime) await runtime.end().catch(() => {});
    await admin.end().catch(() => {});
  }
}

if (require.main === module) main().catch(error => {
  console.error(JSON.stringify({ event: "neon_provision_failed", code: /^[A-Z0-9_]+$/.test(error.code || "") ? error.code : "PROVISION_ERROR" }));
  process.exitCode = 1;
});

module.exports = { scramVerifier };
