-- Run as the schema owner AFTER schema/migrations and AFTER creating the
-- dedicated robotactic_app login privately. Never use the owner in Hyperdrive.
-- This grants application DML only; it does not grant DDL, ownership, or BYPASSRLS.
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'robotactic_app') THEN
        RAISE EXCEPTION 'Create the dedicated robotactic_app role first.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'robotactic_app'
        AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls)) THEN
        RAISE EXCEPTION 'robotactic_app must be a non-administrative role without BYPASSRLS.';
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO robotactic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.admin_users, public.admin_user_permissions, public.competitions,
    public.workshops, public.projects, public.announcements,
    public.competition_teams, public.speakers, public.workshop_speakers,
    public.project_members, public.event_team_members TO robotactic_app;
GRANT SELECT, UPDATE ON public.site_settings, public.about_page TO robotactic_app;
GRANT SELECT, INSERT, UPDATE ON public.public_section_visibility TO robotactic_app;
GRANT SELECT ON public.project_categories, public.timeline_events,
    public.sponsors, public.faqs TO robotactic_app;
GRANT USAGE ON SEQUENCE
    public.admin_users_id_seq, public.competitions_id_seq,
    public.workshops_id_seq, public.projects_id_seq, public.announcements_id_seq,
    public.competition_teams_id_seq, public.speakers_id_seq,
    public.project_members_id_seq, public.event_team_members_id_seq TO robotactic_app;

-- RLS stays enabled. These backend-only policies do not grant Data API access
-- to Supabase anon/authenticated roles. API role checks remain in Express.
DROP POLICY IF EXISTS robotactic_backend ON public.admin_users;
CREATE POLICY robotactic_backend ON public.admin_users FOR ALL TO robotactic_app USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS robotactic_backend ON public.admin_user_permissions;
CREATE POLICY robotactic_backend ON public.admin_user_permissions FOR ALL TO robotactic_app USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS robotactic_backend ON public.speakers;
CREATE POLICY robotactic_backend ON public.speakers FOR ALL TO robotactic_app USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS robotactic_backend ON public.workshop_speakers;
CREATE POLICY robotactic_backend ON public.workshop_speakers FOR ALL TO robotactic_app USING (true) WITH CHECK (true);

COMMIT;
