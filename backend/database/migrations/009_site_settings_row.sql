-- The dashboard edits the single site_settings row (id = 1) but never creates it.
-- Ensure it exists with no start time, so the team can set the date from the dashboard.
-- The public countdown already treats a missing start time as "not announced".
ALTER TABLE site_settings ALTER COLUMN event_start_at DROP NOT NULL;
ALTER TABLE site_settings ALTER COLUMN general_registration_url DROP NOT NULL;
ALTER TABLE site_settings ALTER COLUMN official_email DROP NOT NULL;

INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
