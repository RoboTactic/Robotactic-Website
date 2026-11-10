const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { randomBytes } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { Client } = require("../backend/node_modules/pg");
const { auditRuntimeRole } = require("../backend/scripts/auditRuntimeRole");
const { buildNeonInitialization } = require("../backend/scripts/prepareNeonDatabase");

// A disposable local PostgreSQL cluster only. Never reads .env or DATABASE_URL.
const bin = process.env.PG_TEST_BIN || (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "");
const executable = name => path.join(bin, name + (process.platform === "win32" ? ".exe" : ""));
const root = path.resolve(__dirname, "..");
const readSql = name => fs.readFileSync(path.join(root, "backend/database", name), "utf8");

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test("runtime role grants are enforced by a disposable PostgreSQL database", { timeout: 120_000 }, async t => {
  assert.ok(bin && fs.existsSync(executable("initdb")), "Set PG_TEST_BIN to a local PostgreSQL bin directory.");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "robotactic-role-test-"));
  const data = path.join(directory, "data");
  const passwordFile = path.join(directory, "bootstrap-password");
  const password = randomBytes(32).toString("base64url");
  const port = await freePort();
  let started = false;
  let client;
  const run = (name, args) => execFileSync(executable(name), args, { windowsHide: true, stdio: "ignore", timeout: 40_000 });
  fs.writeFileSync(passwordFile, password, { mode: 0o600 });
  try {
    run("initdb", ["-D", data, "-U", "fixture_owner", "--auth=scram-sha-256", "--pwfile", passwordFile, "--no-locale", "--encoding=UTF8"]);
    fs.unlinkSync(passwordFile);
    started = true;
    run("pg_ctl", ["-D", data, "-l", path.join(directory, "server.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"]);
    client = new Client({ host: "127.0.0.1", port, user: "fixture_owner", password, database: "postgres", ssl: false });
    await client.connect();
    await client.query(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE TABLE auth.private_fixture(id integer);
      CREATE VIEW public.unapproved_fixture_view AS SELECT id FROM auth.private_fixture`);
    await client.query(readSql("schema.sql"));
    await client.query(readSql("inspectRuntimeRole.sql"));
    const before = await snapshot(client);
    const missing = await auditRuntimeRole(client);
    assert.equal(missing.roleExists, false);
    await client.query(readSql("createRuntimeRole.sql"));
    await client.query(readSql("runtimePermissions.sql"));

    await t.test("only API columns, commands and dedicated RLS policies are allowed", async () => {
      const report = await auditRuntimeRole(client, { verify: true });
      assert.deepEqual(report.findings, []);
      assert.equal(report.verified, true);
      assert.equal(report.role.rolcanlogin, false);
      assert.equal(report.passwordLoginVerified, false);
      assert.equal(report.session.client_tls, false);
      assert.ok((await auditRuntimeRole(client, { runtimeLogin: true })).findings.some(f => f.includes("TLS login")));
      assert.ok(report.plansChecked > 30);
      assert.deepEqual(await snapshot(client), before, "Audit must not change rows or advance identity sequences.");
      // Actual writes happen only in this disposable fixture, never in the audit.
      await client.query("BEGIN; SET LOCAL ROLE robotactic_app");
      const inserted = await client.query(`INSERT INTO public.admin_users
        (full_name,login_name,role_code,password_hash)
        VALUES ('Fixture','fixture_user','super_admin','fixture-only-invalid-hash') RETURNING id`);
      const id = inserted.rows[0].id;
      await client.query("INSERT INTO public.admin_user_permissions(user_id,scope) VALUES ($1,'projects')", [id]);
      await client.query("UPDATE public.admin_users SET is_active=false,updated_at=CURRENT_TIMESTAMP WHERE id=$1", [id]);
      assert.equal((await client.query("SELECT 1 FROM public.admin_users WHERE id=$1", [id])).rowCount, 1);
      await client.query("DELETE FROM public.admin_users WHERE id=$1", [id]);
      await client.query("ROLLBACK");
      await client.query(readSql("runtimePermissions.sql")); // Safe to repeat without policy replacement.
      await assert.rejects(client.query(readSql("createRuntimeRole.sql")), { code: "42710" });
      await client.query("ROLLBACK");
    });

    await t.test("unexpected UPDATE and PUBLIC access are detected", async () => {
      await client.query("GRANT UPDATE ON public.project_members TO robotactic_app");
      assert.ok((await auditRuntimeRole(client, { verify: true })).findings.some(f => f.includes("project_members")));
      await client.query("REVOKE UPDATE ON public.project_members FROM robotactic_app");
      await client.query("GRANT USAGE ON SCHEMA auth TO PUBLIC; GRANT SELECT ON auth.private_fixture TO PUBLIC");
      assert.ok((await auditRuntimeRole(client)).findings.some(f => f.includes("auth.private_fixture")));
      await client.query("REVOKE SELECT ON auth.private_fixture FROM PUBLIC; REVOKE USAGE ON SCHEMA auth FROM PUBLIC");
    });

    await t.test("role membership cannot smuggle administrative SET ROLE access", async () => {
      await client.query("GRANT fixture_owner TO robotactic_app");
      assert.ok((await auditRuntimeRole(client)).findings.some(f => f.includes("membership")));
      await assert.rejects(client.query(readSql("runtimePermissions.sql")), { code: "P0001" });
      await client.query("ROLLBACK");
      await client.query("REVOKE fixture_owner FROM robotactic_app");
    });

    await t.test("legacy SERIAL receives USAGE only while identity sequences stay private", async () => {
      await client.query(`ALTER TABLE public.event_team_members ALTER COLUMN id DROP IDENTITY;
        CREATE SEQUENCE public.event_team_members_serial_seq OWNED BY public.event_team_members.id;
        ALTER TABLE public.event_team_members ALTER COLUMN id SET DEFAULT nextval('public.event_team_members_serial_seq')`);
      await client.query(readSql("runtimePermissions.sql"));
      const report = await auditRuntimeRole(client, { verify: true });
      assert.deepEqual(report.findings, []);
      const { rows } = await client.query(`SELECT
        has_sequence_privilege('robotactic_app','public.event_team_members_serial_seq','USAGE') AS usage,
        has_sequence_privilege('robotactic_app','public.event_team_members_serial_seq','UPDATE') AS update,
        has_sequence_privilege('robotactic_app','public.admin_users_id_seq','USAGE') AS identity_usage`);
      assert.deepEqual(rows[0], { usage: true, update: false, identity_usage: false });
      await client.query("BEGIN; SET LOCAL ROLE robotactic_app");
      const inserted = await client.query(`INSERT INTO public.event_team_members
        (name_ar,name_en,role_ar,role_en,display_order,status)
        VALUES ('اختبار','Fixture','اختبار','Fixture',1,'draft') RETURNING id`);
      assert.ok(inserted.rows[0].id > 0);
      await client.query("ROLLBACK");
    });

    await t.test("conflicting existing policies are preserved and fail for review", async () => {
      await client.query("ALTER POLICY robotactic_app_select ON public.admin_users TO anon");
      await assert.rejects(client.query(readSql("runtimePermissions.sql")), { code: "P0001" });
      await client.query("ROLLBACK");
      const { rows } = await client.query("SELECT roles::text[] FROM pg_policies WHERE schemaname='public' AND tablename='admin_users' AND policyname='robotactic_app_select'");
      assert.deepEqual(rows[0].roles, ["anon"]);
    });

    await t.test("fresh Neon proposal works under a non-superuser CREATEROLE owner and refuses to overwrite it", async () => {
      // Only this isolated cluster: free the test role for a second fresh DB.
      await client.query("DROP OWNED BY robotactic_app; DROP ROLE robotactic_app; CREATE ROLE neon_superuser; CREATE ROLE fixture_admin CREATEROLE");
      await client.query("CREATE DATABASE neon_fixture OWNER fixture_admin");
      const neon = new Client({ host: "127.0.0.1", port, user: "fixture_owner", password, database: "neon_fixture", ssl: false });
      try {
        await neon.connect();
        await neon.query("SET SESSION AUTHORIZATION fixture_admin");
        const sql = buildNeonInitialization();
        assert.equal(sql, readSql("neon-initialize.sql"), "Regenerate the reviewed proposal after changing source SQL.");
        await neon.query(sql);
        const report = await auditRuntimeRole(neon, { verify: true });
        assert.deepEqual(report.findings, []);
        assert.equal(report.verified, true);
        assert.equal(report.role.rolcanlogin, false);
        assert.ok(report.memberships.some(m => m.parent === "robotactic_app" && m.member === "fixture_admin"));
        assert.ok(report.memberships.every(m => m.member !== "robotactic_app"));
        assert.equal((await neon.query("SELECT count(*)::int AS count FROM public.competitions")).rows[0].count, 3);
        assert.equal((await neon.query("SELECT count(*)::int AS count FROM public.schema_migrations")).rows[0].count, 7);
        const beforeRetry = await snapshot(neon);
        await assert.rejects(neon.query(sql), { code: "P0001" });
        await neon.query("ROLLBACK");
        assert.deepEqual(await snapshot(neon), beforeRetry);
      } finally { await neon.end(); }
    });
  } finally {
    if (client) await client.end().catch(() => {});
    if (started && fs.existsSync(path.join(data, "postmaster.pid"))) run("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
    // Delete only this test's own verified temporary directory, never a DB from env.
    const resolved = path.resolve(directory);
    const expectedParent = path.resolve(os.tmpdir());
    assert.equal(path.dirname(resolved), expectedParent);
    assert.ok(path.basename(resolved).startsWith("robotactic-role-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

async function snapshot(client) {
  const { rows: names } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  const counts = {};
  for (const { tablename } of names) counts[tablename] = (await client.query(`SELECT count(*)::text AS count FROM public."${tablename.replaceAll('"','""')}"`)).rows[0].count;
  const { rows: sequences } = await client.query("SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename");
  return { counts, sequences };
}
