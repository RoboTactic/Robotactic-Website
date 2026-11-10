-- REVIEWED PROPOSAL ONLY. Run manually as the database administrator AFTER approval.
-- No password, data changes, administrative role grants, or automatic migration hook.
-- Existing role => fail; never silently modify an existing identity.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE ROLE robotactic_app
    NOLOGIN
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT
    PASSWORD NULL;

ALTER ROLE robotactic_app SET search_path = public, pg_temp;

-- PostgreSQL 16+ gives a CREATEROLE creator ADMIN on its new role, but no SET
-- permission by default. Let that administrator verify the new role using SET
-- ROLE. Direction is runtime -> administrator, NEVER administrator -> runtime.
-- The application receives no membership in the administrator or neon_superuser.
DO $creator_access$
BEGIN
    IF current_setting('server_version_num')::integer >= 160000
       AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
        EXECUTE format('GRANT robotactic_app TO %I WITH SET TRUE', current_user);
        EXECUTE format('GRANT robotactic_app TO %I WITH INHERIT FALSE', current_user);
    END IF;
END
$creator_access$;

COMMIT;

-- Keep NOLOGIN while grants and effective permissions are reviewed.
-- Then, in psql over verified TLS, use these interactively AFTER approval:
--   SET password_encryption = 'scram-sha-256';
--   \password robotactic_app
--   ALTER ROLE robotactic_app LOGIN;
-- Never put the password in a SQL statement, connection CLI argument, or Git.
