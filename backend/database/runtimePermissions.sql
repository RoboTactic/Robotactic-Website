-- REVIEWED PROPOSAL ONLY: execute manually AFTER approval and createRuntimeRole.sql.
-- Explicit tables/columns only. No default grants, role memberships or data changes.
-- Keep robotactic_app NOLOGIN until the separate read-only audit passes.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $guard$
DECLARE app_oid oid;
BEGIN
    SELECT oid INTO app_oid FROM pg_roles
    WHERE rolname = 'robotactic_app'
      AND NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit);
    IF app_oid IS NULL THEN
        RAISE EXCEPTION 'robotactic_app must exist without administrative attributes or inheritance.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles administrator ON administrator.oid = m.member
        WHERE m.member = app_oid OR (m.roleid = app_oid AND NOT (administrator.rolcreaterole
            AND EXISTS (SELECT 1 FROM pg_auth_members authority WHERE authority.roleid=app_oid
                AND authority.member=m.member AND authority.admin_option)
            AND NOT coalesce((to_jsonb(m)->>'inherit_option')::boolean,false)))) THEN
        RAISE EXCEPTION 'Unexpected role membership: review before granting application access.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relowner = app_oid)
       OR EXISTS (SELECT 1 FROM pg_namespace WHERE nspowner = app_oid)
       OR EXISTS (SELECT 1 FROM pg_proc WHERE proowner = app_oid)
       OR EXISTS (SELECT 1 FROM pg_type WHERE typowner = app_oid)
       OR EXISTS (SELECT 1 FROM pg_database WHERE datdba = app_oid) THEN
        RAISE EXCEPTION 'The runtime role must not own database objects.';
    END IF;
    IF has_schema_privilege(app_oid, 'public', 'CREATE') THEN
        RAISE EXCEPTION 'Effective CREATE on public is unsafe; review PUBLIC grants separately.';
    END IF;
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO robotactic_app', current_database());
END
$guard$;

GRANT USAGE ON SCHEMA public TO robotactic_app;

GRANT SELECT ON TABLE public."event_team_members" TO robotactic_app;
GRANT INSERT ("name_ar", "name_en", "role_ar", "role_en", "bio_ar", "bio_en", "image_url", "public_email", "contact_url", "linkedin_url", "x_url", "display_order", "status") ON TABLE public."event_team_members" TO robotactic_app;
GRANT UPDATE ("name_ar", "name_en", "role_ar", "role_en", "bio_ar", "bio_en", "image_url", "public_email", "contact_url", "linkedin_url", "x_url", "display_order", "status", "updated_at") ON TABLE public."event_team_members" TO robotactic_app;
GRANT DELETE ON TABLE public."event_team_members" TO robotactic_app;

GRANT SELECT ON TABLE public."competitions" TO robotactic_app;
GRANT INSERT ("name_ar", "name_en", "description_ar", "description_en", "category_code", "requirements_ar", "requirements_en", "audience_type", "team_size_min", "team_size_max", "max_teams", "start_at", "end_at", "registration_status", "registration_url", "image_url", "status", "is_featured", "featured_order") ON TABLE public."competitions" TO robotactic_app;
GRANT UPDATE ("name_ar", "name_en", "description_ar", "description_en", "category_code", "requirements_ar", "requirements_en", "audience_type", "team_size_min", "team_size_max", "max_teams", "start_at", "end_at", "registration_status", "registration_url", "image_url", "status", "is_featured", "featured_order", "updated_at") ON TABLE public."competitions" TO robotactic_app;
GRANT DELETE ON TABLE public."competitions" TO robotactic_app;

GRANT SELECT ON TABLE public."workshops" TO robotactic_app;
GRANT INSERT ("title_ar", "title_en", "description_ar", "description_en", "image_url", "start_at", "end_at", "capacity", "available_seats", "registration_status", "registration_url", "meeting_url", "status", "is_featured", "featured_order") ON TABLE public."workshops" TO robotactic_app;
GRANT UPDATE ("title_ar", "title_en", "description_ar", "description_en", "image_url", "start_at", "end_at", "capacity", "available_seats", "registration_status", "registration_url", "meeting_url", "status", "is_featured", "featured_order", "updated_at") ON TABLE public."workshops" TO robotactic_app;
GRANT DELETE ON TABLE public."workshops" TO robotactic_app;

GRANT SELECT ON TABLE public."projects" TO robotactic_app;
GRANT INSERT ("name_ar", "name_en", "description_ar", "description_en", "project_type", "category_id", "image_url", "team_name", "team_leader_name", "project_url", "video_url", "technologies", "stage_ar", "stage_en", "status", "is_featured", "featured_order") ON TABLE public."projects" TO robotactic_app;
GRANT UPDATE ("name_ar", "name_en", "description_ar", "description_en", "project_type", "category_id", "image_url", "team_name", "team_leader_name", "project_url", "video_url", "technologies", "stage_ar", "stage_en", "status", "is_featured", "featured_order", "updated_at") ON TABLE public."projects" TO robotactic_app;
GRANT DELETE ON TABLE public."projects" TO robotactic_app;

GRANT SELECT ON TABLE public."announcements" TO robotactic_app;
GRANT INSERT ("title_ar", "title_en", "description_ar", "description_en", "image_url", "link_url", "start_at", "end_at", "status") ON TABLE public."announcements" TO robotactic_app;
GRANT UPDATE ("title_ar", "title_en", "description_ar", "description_en", "image_url", "link_url", "start_at", "end_at", "status", "updated_at") ON TABLE public."announcements" TO robotactic_app;
GRANT DELETE ON TABLE public."announcements" TO robotactic_app;

GRANT SELECT ON TABLE public."competition_teams" TO robotactic_app;
GRANT INSERT ("competition_id", "team_name", "team_leader_name", "leader_email", "leader_phone", "member_names") ON TABLE public."competition_teams" TO robotactic_app;
GRANT UPDATE ("competition_id", "team_name", "team_leader_name", "leader_email", "leader_phone", "member_names", "updated_at") ON TABLE public."competition_teams" TO robotactic_app;
GRANT DELETE ON TABLE public."competition_teams" TO robotactic_app;

GRANT SELECT ON TABLE public."admin_users" TO robotactic_app;
GRANT INSERT ("full_name", "login_name", "email", "phone", "role_code", "password_hash") ON TABLE public."admin_users" TO robotactic_app;
GRANT UPDATE ("full_name", "login_name", "email", "phone", "role_code", "password_hash", "is_active", "updated_at") ON TABLE public."admin_users" TO robotactic_app;
GRANT DELETE ON TABLE public."admin_users" TO robotactic_app;

GRANT SELECT ON TABLE public."admin_user_permissions" TO robotactic_app;
GRANT INSERT ("user_id", "scope") ON TABLE public."admin_user_permissions" TO robotactic_app;
GRANT DELETE ON TABLE public."admin_user_permissions" TO robotactic_app;

GRANT SELECT ON TABLE public."speakers" TO robotactic_app;
GRANT INSERT ("full_name", "phone", "notes") ON TABLE public."speakers" TO robotactic_app;
GRANT UPDATE ("full_name", "phone", "notes", "updated_at") ON TABLE public."speakers" TO robotactic_app;
GRANT DELETE ON TABLE public."speakers" TO robotactic_app;

GRANT SELECT ON TABLE public."workshop_speakers" TO robotactic_app;
GRANT INSERT ("workshop_id", "speaker_id", "is_public") ON TABLE public."workshop_speakers" TO robotactic_app;
GRANT UPDATE ("is_public", "updated_at") ON TABLE public."workshop_speakers" TO robotactic_app;
GRANT DELETE ON TABLE public."workshop_speakers" TO robotactic_app;

GRANT SELECT ON TABLE public."project_members" TO robotactic_app;
GRANT INSERT ("project_id", "name", "linkedin_url", "x_url", "display_order") ON TABLE public."project_members" TO robotactic_app;
GRANT DELETE ON TABLE public."project_members" TO robotactic_app;

GRANT SELECT ON TABLE public."site_settings" TO robotactic_app;
GRANT UPDATE ("event_start_at", "updated_at") ON TABLE public."site_settings" TO robotactic_app;

GRANT SELECT ON TABLE public."about_page" TO robotactic_app;
GRANT UPDATE ("title_ar", "title_en", "subtitle_ar", "subtitle_en", "body_ar", "body_en", "values_ar", "values_en", "image_url", "image_alt_ar", "image_alt_en", "status", "updated_at") ON TABLE public."about_page" TO robotactic_app;

GRANT SELECT ON TABLE public."public_section_visibility" TO robotactic_app;
GRANT INSERT ("section_key", "is_visible") ON TABLE public."public_section_visibility" TO robotactic_app;
GRANT UPDATE ("is_visible", "updated_at") ON TABLE public."public_section_visibility" TO robotactic_app;

GRANT SELECT ON TABLE public."project_categories" TO robotactic_app;

GRANT SELECT ON TABLE public."timeline_events" TO robotactic_app;

GRANT SELECT ON TABLE public."sponsors" TO robotactic_app;

GRANT SELECT ON TABLE public."faqs" TO robotactic_app;

-- Identity columns do not need standalone sequence access for INSERT.
-- For legacy SERIAL columns, grant USAGE only on their associated sequences.
-- Never grant UPDATE (setval), SELECT, or privileges on every sequence.
DO $policies$
DECLARE
    item record;
    command text;
    column_name text;
    sequence_name text;
    policy_name text;
    command_code "char";
    predicate text;
    table_oid oid;
    app_oid oid := (SELECT oid FROM pg_roles WHERE rolname = 'robotactic_app');
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset($matrix$[
        {"table":"event_team_members","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["name_ar","name_en","role_ar","role_en","bio_ar","bio_en","image_url","public_email","contact_url","linkedin_url","x_url","display_order","status"]},
        {"table":"competitions","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["name_ar","name_en","description_ar","description_en","category_code","requirements_ar","requirements_en","audience_type","team_size_min","team_size_max","max_teams","start_at","end_at","registration_status","registration_url","image_url","status","is_featured","featured_order"]},
        {"table":"workshops","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["title_ar","title_en","description_ar","description_en","image_url","start_at","end_at","capacity","available_seats","registration_status","registration_url","meeting_url","status","is_featured","featured_order"]},
        {"table":"projects","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["name_ar","name_en","description_ar","description_en","project_type","category_id","image_url","team_name","team_leader_name","project_url","video_url","technologies","stage_ar","stage_en","status","is_featured","featured_order"]},
        {"table":"announcements","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["title_ar","title_en","description_ar","description_en","image_url","link_url","start_at","end_at","status"]},
        {"table":"competition_teams","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["competition_id","team_name","team_leader_name","leader_email","leader_phone","member_names"]},
        {"table":"admin_users","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["full_name","login_name","email","phone","role_code","password_hash"]},
        {"table":"admin_user_permissions","commands":["SELECT","INSERT","DELETE"],"insert":["user_id","scope"]},
        {"table":"speakers","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["full_name","phone","notes"]},
        {"table":"workshop_speakers","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["workshop_id","speaker_id","is_public"]},
        {"table":"project_members","commands":["SELECT","INSERT","DELETE"],"insert":["project_id","name","linkedin_url","x_url","display_order"]},
        {"table":"site_settings","commands":["SELECT","UPDATE"],"insert":[]},
        {"table":"about_page","commands":["SELECT","UPDATE"],"insert":[]},
        {"table":"public_section_visibility","commands":["SELECT","INSERT","UPDATE"],"insert":["section_key","is_visible"]},
        {"table":"project_categories","commands":["SELECT"],"insert":[]},
        {"table":"timeline_events","commands":["SELECT"],"insert":[]},
        {"table":"sponsors","commands":["SELECT"],"insert":[]},
        {"table":"faqs","commands":["SELECT"],"insert":[]}
    ]$matrix$::jsonb)
        AS m("table" text, commands text[], "insert" text[])
    LOOP
        table_oid := to_regclass(format('public.%I', item."table"));
        IF table_oid IS NULL OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = table_oid AND relkind IN ('r','p')) THEN
            RAISE EXCEPTION 'Required application table is missing or is not a table: %', item."table";
        END IF;
        IF cardinality(item."insert") > 0 THEN
        FOR column_name IN SELECT attname FROM pg_attribute
            WHERE attrelid = table_oid AND attnum > 0 AND attidentity = '' AND NOT attisdropped
        LOOP
                sequence_name := pg_get_serial_sequence(format('public.%I', item."table"), column_name);
                IF sequence_name IS NOT NULL THEN
                    EXECUTE format('GRANT USAGE ON SEQUENCE %s TO robotactic_app', sequence_name::regclass);
                END IF;
        END LOOP;
        END IF;
        -- Preserve whether RLS is enabled and all existing policies.
        -- Each policy applies only to this backend role and one required command.
        IF (SELECT relrowsecurity FROM pg_class WHERE oid = table_oid) THEN
            FOREACH command IN ARRAY item.commands LOOP
                policy_name := 'robotactic_app_' || lower(command);
                command_code := CASE command WHEN 'SELECT' THEN 'r' WHEN 'INSERT' THEN 'a'
                    WHEN 'UPDATE' THEN 'w' WHEN 'DELETE' THEN 'd' END;
                IF EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = table_oid AND polname = policy_name) THEN
                    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = table_oid AND polname = policy_name
                        AND polroles = ARRAY[app_oid] AND polcmd = command_code AND polpermissive
                        AND (command = 'INSERT' OR pg_get_expr(polqual, polrelid) = 'true')
                        AND (command IN ('SELECT','DELETE') OR pg_get_expr(polwithcheck, polrelid) = 'true')) THEN
                        RAISE EXCEPTION 'Existing policy requires review: %.%', item."table", policy_name;
                    END IF;
                ELSE
                    predicate := CASE command WHEN 'INSERT' THEN 'WITH CHECK (true)'
                        WHEN 'UPDATE' THEN 'USING (true) WITH CHECK (true)' ELSE 'USING (true)' END;
                    EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO robotactic_app %s',
                        policy_name, item."table", command, predicate);
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END
$policies$;

COMMIT;
