-- Additive migration. Public supervisor names and titles for each competition track.
-- No contact details are stored here: only what may be shown on the public site.
CREATE TABLE IF NOT EXISTS competition_supervisors (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    title_ar TEXT,
    title_en TEXT,
    linkedin_url TEXT,
    display_order INTEGER CHECK (display_order IS NULL OR display_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS competition_supervisors_competition_id_idx ON competition_supervisors (competition_id);

-- Reads go through the backend only; keep Supabase Data API roles out.
ALTER TABLE competition_supervisors ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON competition_supervisors FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON competition_supervisors FROM authenticated;
    END IF;
END $$;
