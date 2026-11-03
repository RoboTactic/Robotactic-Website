CREATE TABLE IF NOT EXISTS public_section_visibility (
    section_key VARCHAR(30) PRIMARY KEY
        CHECK (section_key IN ('competitions', 'workshops', 'projects', 'announcements', 'about', 'team', 'timeline')),
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public_section_visibility (section_key)
VALUES ('competitions'), ('workshops'), ('projects'), ('announcements'), ('about'), ('team'), ('timeline')
ON CONFLICT (section_key) DO NOTHING;
