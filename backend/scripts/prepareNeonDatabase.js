// Produces a reviewable SQL file only. Never loads .env or connects to a database.
const fs = require("node:fs");
const path = require("node:path");
const directory = path.resolve(__dirname, "../database");

function buildNeonInitialization() {
  const read = name => fs.readFileSync(path.join(directory, name), "utf8");
  const unwrap = sql => sql.replace(/^\s*(?:BEGIN|COMMIT);\s*$/gm, "");
  const migrations = fs.readdirSync(path.join(directory, "migrations"))
    .filter(name => /^\d+_[\w-]+\.sql$/.test(name)).sort();
  return `-- GENERATED REVIEW COPY: npm --prefix backend run db:neon:prepare
-- Requires explicit approval. This file is NOT run by build/deploy/CI.
-- Target: a completely empty Neon public schema and an absent robotactic_app role.
-- Creates schema, existing project migration defaults, and a NOLOGIN runtime role.
-- No passwords, participant records, sample users, or destructive reset commands.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $empty_neon_guard$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neon_superuser') THEN
        RAISE EXCEPTION 'This proposal is for Neon only.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f','S')) THEN
        RAISE EXCEPTION 'public is not empty. Stop and review existing data; do not reset it.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='robotactic_app') THEN
        RAISE EXCEPTION 'robotactic_app already exists. Review instead of recreating it.';
    END IF;
END
$empty_neon_guard$;

-- Current project schema; Supabase Storage setup is conditional and skipped on Neon.
${read("schema.sql")}

CREATE TABLE public.schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
${migrations.map(name => `\n-- Migration: ${name}\n${read(`migrations/${name}`)}\nINSERT INTO public.schema_migrations(name) VALUES ('${name}');`).join("\n")}

-- Runtime login remains disabled until reviewed and a password is set privately.
${unwrap(read("createRuntimeRole.sql"))}
${unwrap(read("runtimePermissions.sql"))}
COMMIT;
`;
}

if (require.main === module) {
  fs.writeFileSync(path.join(directory, "neon-initialize.sql"), buildNeonInitialization());
  console.log("Prepared backend/database/neon-initialize.sql for review. No database connection was made.");
}

module.exports = { buildNeonInitialization };
