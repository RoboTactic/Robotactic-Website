-- Read-only metadata inspection for Supabase SQL Editor or psql.
-- No table contents, passwords, password hashes, or mutations are returned.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';

SELECT current_setting('server_version_num') AS server_version,
       current_setting('transaction_read_only') AS read_only;

SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole,
       rolreplication, rolbypassrls, rolinherit
FROM pg_roles WHERE rolname = 'robotactic_app';

SELECT c.relname AS table_name, c.relkind AS kind,
       c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner,
       EXISTS (SELECT 1 FROM aclexplode(coalesce(c.relacl, acldefault('r',c.relowner))) acl
               WHERE acl.grantee = 0) AS has_public_table_grants
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relname;

SELECT c.relname AS table_name, a.attname AS column_name, a.attidentity AS identity,
       pg_get_serial_sequence(c.oid::regclass::text, a.attname) AS associated_sequence
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
ORDER BY c.relname, a.attnum;

SELECT tablename, policyname, permissive, roles::text[], cmd
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT parent.rolname AS parent, member.rolname AS member
FROM pg_auth_members m JOIN pg_roles parent ON parent.oid = m.roleid
JOIN pg_roles member ON member.oid = m.member
WHERE parent.rolname = 'robotactic_app' OR member.rolname = 'robotactic_app';

SELECT n.nspname AS schema_name,
       EXISTS (SELECT 1 FROM aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) acl
               WHERE acl.grantee = 0 AND acl.privilege_type = 'CREATE') AS public_can_create
FROM pg_namespace n WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema';

SELECT n.nspname AS schema_name, pg_get_userbyid(d.defaclrole) AS owner,
       d.defaclobjtype AS object_type,
       CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END AS grantee,
       acl.privilege_type, acl.is_grantable
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
WHERE acl.grantee = 0 OR acl.grantee = (SELECT oid FROM pg_roles WHERE rolname = 'robotactic_app');

ROLLBACK;
