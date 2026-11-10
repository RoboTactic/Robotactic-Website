// Read-only audit. Does not provision roles, change passwords, or run migrations.
const path = require("node:path");
const { roleName, tables: required } = require("./runtimeRoleDefinition");
const { getDatabaseConnectionOptions } = require("../config/databaseSsl");

async function auditRuntimeRole(client, { verify = false, runtimeLogin = false } = {}) {
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SET LOCAL lock_timeout = '2s'");
    const session = (await client.query(`SELECT current_user, session_user,
      current_setting('transaction_read_only') AS read_only,
      (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()) AS backend_tls`)).rows[0];
    const stream = client.connection?.stream;
    session.client_tls = Boolean(stream?.encrypted && stream.authorized === true);
    const role = (await client.query(`SELECT oid, rolcanlogin, rolsuper, rolcreatedb,
      rolcreaterole, rolreplication, rolbypassrls, rolinherit,
      EXISTS (SELECT 1 FROM pg_type WHERE typowner = pg_roles.oid) AS owns_types
      FROM pg_roles WHERE rolname = $1`, [roleName])).rows[0];
    const objects = (await client.query(`SELECT c.oid, n.nspname AS schema, c.relname AS name,
      c.relkind AS kind, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls,
      c.relowner = r.oid AS owned, has_schema_privilege(r.oid, n.oid, 'USAGE') AS accessible,
      has_table_privilege(r.oid, c.oid, 'SELECT') AS "select",
      has_table_privilege(r.oid, c.oid, 'DELETE') AS "delete",
      has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS truncate,
      has_table_privilege(r.oid, c.oid, 'REFERENCES') AS "references",
      has_table_privilege(r.oid, c.oid, 'TRIGGER') AS trigger,
      EXISTS (SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
        WHERE acl.grantee IN (0, r.oid) AND acl.is_grantable) AS grantable,
      EXISTS (SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
        WHERE acl.grantee IN (0, r.oid) AND acl.privilege_type NOT IN ('SELECT','INSERT','UPDATE','DELETE')) AS extra_acl
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_roles r ON r.rolname = $1
      WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname NOT LIKE 'pg_%'
        AND n.nspname <> 'information_schema' ORDER BY n.nspname, c.relname`, [roleName])).rows;
    const columns = (await client.query(`SELECT n.nspname AS schema, c.relname AS "table", a.attname AS name,
      a.attidentity AS identity, to_regclass(pg_get_serial_sequence(c.oid::regclass::text, a.attname))::oid AS sequence_oid,
      has_column_privilege(r.oid, c.oid, a.attnum, 'INSERT') AS "insert",
      has_column_privilege(r.oid, c.oid, a.attnum, 'UPDATE') AS "update",
      has_column_privilege(r.oid, c.oid, a.attnum, 'REFERENCES') AS "references",
      EXISTS (SELECT 1 FROM aclexplode(a.attacl) acl WHERE acl.grantee IN (0,r.oid) AND acl.is_grantable) AS grantable
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      LEFT JOIN pg_roles r ON r.rolname = $1
      WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname NOT LIKE 'pg_%'
        AND n.nspname <> 'information_schema'`, [roleName])).rows;
    const policies = (await client.query(`SELECT n.nspname AS schema, c.relname AS "table",
      p.polname AS name, p.polcmd AS command, p.polpermissive AS permissive,
      p.polroles = ARRAY[r.oid] AS dedicated,
      0 = ANY(p.polroles) OR r.oid = ANY(p.polroles) AS applicable,
      pg_get_expr(p.polqual, p.polrelid) = 'true' AS using_true,
      pg_get_expr(p.polwithcheck, p.polrelid) = 'true' AS check_true
      FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace LEFT JOIN pg_roles r ON r.rolname = $1
      WHERE n.nspname = 'public' ORDER BY c.relname, p.polname`, [roleName])).rows;
    const schemas = (await client.query(`SELECT n.nspname AS name, n.nspowner = r.oid AS owned,
      has_schema_privilege(r.oid, n.oid, 'CREATE') AS create_schema_objects,
      EXISTS (SELECT 1 FROM aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) acl
        WHERE acl.grantee IN (0,r.oid) AND acl.is_grantable) AS grantable
      FROM pg_namespace n LEFT JOIN pg_roles r ON r.rolname = $1
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'`, [roleName])).rows;
    const memberships = (await client.query(`SELECT parent.rolname AS parent, member.rolname AS member,
      member.rolcreaterole AS member_is_administrator, m.admin_option,
      EXISTS (SELECT 1 FROM pg_auth_members authority WHERE authority.roleid=m.roleid
        AND authority.member=m.member AND authority.admin_option) AS can_administer,
      coalesce((to_jsonb(m)->>'inherit_option')::boolean,false) AS inherit_option
      FROM pg_auth_members m JOIN pg_roles parent ON parent.oid = m.roleid
      JOIN pg_roles member ON member.oid = m.member
      WHERE parent.rolname = $1 OR member.rolname = $1`, [roleName])).rows;
    const sequences = (await client.query(`SELECT c.oid, n.nspname AS schema, c.relname AS name,
      c.relowner = r.oid AS owned, has_sequence_privilege(r.oid,c.oid,'USAGE') AS usage,
      has_sequence_privilege(r.oid,c.oid,'SELECT') AS "select",
      has_sequence_privilege(r.oid,c.oid,'UPDATE') AS "update",
      EXISTS (SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('S',c.relowner))) acl
        WHERE acl.grantee IN (0,r.oid) AND acl.is_grantable) AS grantable
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_roles r ON r.rolname = $1 WHERE c.relkind = 'S' AND n.nspname NOT LIKE 'pg_%'`, [roleName])).rows;
    const functions = (await client.query(`SELECT n.nspname AS schema, p.proname AS name,
      p.proowner = r.oid AS owned, p.prosecdef AS security_definer,
      has_schema_privilege(r.oid,n.oid,'USAGE') AND has_function_privilege(r.oid,p.oid,'EXECUTE') AS executable
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      LEFT JOIN pg_roles r ON r.rolname = $1
      WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'`, [roleName])).rows;
    const database = (await client.query(`SELECT d.datdba = r.oid AS owned,
      has_database_privilege(r.oid,d.oid,'CONNECT') AS connect,
      has_database_privilege(r.oid,d.oid,'CREATE') AS create_schema,
      has_database_privilege(r.oid,d.oid,'TEMP') AS temporary_objects,
      EXISTS (SELECT 1 FROM aclexplode(coalesce(d.datacl,acldefault('d',d.datdba))) acl
        WHERE acl.grantee IN (0,r.oid) AND acl.is_grantable) AS grantable
      FROM pg_database d LEFT JOIN pg_roles r ON r.rolname = $1 WHERE d.datname = current_database()`, [roleName])).rows[0];
    const findings = [];
    const fail = (condition, detail) => { if (condition) findings.push(detail); };
    fail(!role, "The runtime role does not exist.");
    if (role) {
      fail(["rolsuper","rolcreatedb","rolcreaterole","rolreplication","rolbypassrls","rolinherit"].some(key => role[key]), "Unsafe role attributes.");
      fail(memberships.some(m => m.member === roleName || !(m.parent === roleName && m.member_is_administrator
        && m.can_administer && !m.inherit_option)), "Unexpected role membership (including potential SET ROLE access).");
      fail(database.owned || database.create_schema || database.grantable || !database.connect, "Unsafe or missing database privileges.");
      fail(schemas.some(s => s.owned || s.create_schema_objects || s.grantable), "Unexpected schema ownership or privileges; review PUBLIC grants.");
      fail(role.owns_types || objects.some(t => t.owned) || sequences.some(s => s.owned) || functions.some(f => f.owned), "The runtime role owns database objects.");
      for (const [table, rule] of Object.entries(required)) {
        const object = objects.find(t => t.schema === "public" && t.name === table);
        fail(!object || !["r","p"].includes(object.kind), `Missing application table: ${table}.`);
        if (!object) continue;
        fail(!object.accessible || !object.select || object.delete !== rule.delete, `Incorrect SELECT/DELETE privileges: ${table}.`);
        for (const column of [...rule.insert, ...rule.update]) {
          fail(!columns.some(c => c.schema === "public" && c.table === table && c.name === column), `Missing column: ${table}.${column}.`);
        }
        if (object.rls) {
          for (const command of ["SELECT", ...(rule.insert.length ? ["INSERT"] : []), ...(rule.update.length ? ["UPDATE"] : []), ...(rule.delete ? ["DELETE"] : [])]) {
            const code = { SELECT:"r", INSERT:"a", UPDATE:"w", DELETE:"d" }[command];
            fail(!policies.some(p => p.table === table && p.dedicated && p.permissive && p.command === code
              && (command === "INSERT" || p.using_true) && (["SELECT","DELETE"].includes(command) || p.check_true)), `Missing dedicated RLS policy: ${table}/${command}.`);
          }
          fail(policies.some(p => p.table === table && p.applicable && !p.permissive), `Restrictive RLS policy requires review: ${table}.`);
        }
      }
      for (const object of objects) {
        const allowed = object.schema === "public" && required[object.name];
        if (!object.accessible && !allowed) continue;
        fail(object.truncate || object.references || object.trigger || object.grantable || object.extra_acl, `Excess table privileges: ${object.schema}.${object.name}.`);
        fail(!allowed && (object.select || object.delete), `Access to an unapproved table: ${object.schema}.${object.name}.`);
        for (const column of columns.filter(c => c.schema === object.schema && c.table === object.name)) {
          fail(column.insert !== Boolean(allowed && allowed.insert.includes(column.name))
            || column.update !== Boolean(allowed && allowed.update.includes(column.name))
            || column.references || column.grantable, `Incorrect column privileges: ${object.schema}.${object.name}.${column.name}.`);
        }
      }
      const neededSequences = columns.filter(c => c.schema === "public" && !c.identity && c.sequence_oid && required[c.table]?.insert.length).map(c => c.sequence_oid);
      for (const sequence of sequences) {
        fail(sequence.usage !== neededSequences.includes(sequence.oid) || sequence.select || sequence.update || sequence.grantable, `Incorrect sequence privileges: ${sequence.schema}.${sequence.name}.`);
      }
      fail(functions.some(f => f.security_definer && f.executable), "Executable SECURITY DEFINER functions require a separate review, including PUBLIC grants.");
    }
    if (runtimeLogin) fail(session.current_user !== roleName || session.session_user !== roleName || !role?.rolcanlogin || !session.client_tls, "A verified TLS login as robotactic_app is required.");
    let plansChecked = 0;
    if (verify && findings.length === 0) {
      await client.query("SET LOCAL ROLE robotactic_app");
      const quote = value => '"' + value.replaceAll('"', '""') + '"';
      for (const [table, rule] of Object.entries(required)) {
        const name = `public.${quote(table)}`;
        await client.query(`SELECT 1 FROM ${name} LIMIT 0`);
        // EXPLAIN without ANALYZE plans SQL; it does not execute DML or nextval.
        if (rule.insert.length) {
          const fields = rule.insert.map(quote).join(", ");
          await client.query(`EXPLAIN INSERT INTO ${name} (${fields}) SELECT ${fields} FROM ${name} WHERE false`);
          plansChecked++;
        }
        if (rule.update.length) {
          await client.query(`EXPLAIN UPDATE ${name} SET ${rule.update.map(c => `${quote(c)} = ${quote(c)}`).join(", ")} WHERE false`);
          plansChecked++;
        }
        if (rule.delete) { await client.query(`EXPLAIN DELETE FROM ${name} WHERE false`); plansChecked++; }
      }
      await client.query("EXPLAIN SELECT 1 FROM public.about_page FOR UPDATE");
    }
    return { session, roleExists: Boolean(role), role, database, memberships,
      applicationTables: objects.filter(t => t.schema === "public"), policies,
      findings, plansChecked, verified: verify && findings.length === 0,
      passwordLoginVerified: runtimeLogin && findings.length === 0 };
  } finally { await client.query("ROLLBACK"); }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--verify", "--runtime"].includes(arg))) throw new Error("Unsupported audit option.");
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
  const runtimeLogin = args.includes("--runtime");
  const value = process.env[runtimeLogin ? "RUNTIME_DATABASE_URL" : "DATABASE_URL"];
  if (!value) throw new Error("Configure the requested database URL privately in backend/.env.");
  const { Client } = require("pg");
  const client = new Client({ ...getDatabaseConnectionOptions(value, { requireTls: true }),
    connectionTimeoutMillis: 8000, application_name: "robotactic_readonly_role_audit" });
  client.on("error", () => {});
  try {
    await client.connect();
    const report = await auditRuntimeRole(client, { verify: args.includes("--verify"), runtimeLogin });
    console.log(JSON.stringify(report, null, 2));
    if (report.findings.length) process.exitCode = 1;
  } finally { await client.end().catch(() => {}); }
}

if (require.main === module) main().catch(error => {
  const code = /^[A-Z0-9_]+$/.test(error.code || "") ? error.code : "AUDIT_ERROR";
  console.error(JSON.stringify({ event: "readonly_role_audit_failed", code }));
  process.exitCode = 1;
});

module.exports = { auditRuntimeRole };
