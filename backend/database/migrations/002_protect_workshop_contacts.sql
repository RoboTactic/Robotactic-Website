-- Prevent Supabase Data API roles from reading speaker contact details.
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_speakers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON speakers, workshop_speakers FROM anon;
        IF to_regclass('public.workshop_participants') IS NOT NULL THEN
            REVOKE ALL ON workshop_participants FROM anon;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON speakers, workshop_speakers FROM authenticated;
        IF to_regclass('public.workshop_participants') IS NOT NULL THEN
            REVOKE ALL ON workshop_participants FROM authenticated;
        END IF;
    END IF;
    IF to_regclass('public.workshop_participants') IS NOT NULL THEN
        ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
