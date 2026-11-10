-- GENERATED REVIEW COPY: npm --prefix backend run db:neon:prepare
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


CREATE TABLE admin_users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    full_name TEXT NOT NULL,

    email VARCHAR(255) UNIQUE,
    login_name VARCHAR(40) NOT NULL UNIQUE,

    phone VARCHAR(30),

    role_code VARCHAR(50) NOT NULL,

    password_hash TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT admin_users_role_check
        CHECK (
            role_code IN (
                'super_admin',
                'competition_manager',
                'workshop_manager',
                'team_member'
            )
        )
);

ALTER TABLE admin_users ADD CONSTRAINT admin_users_login_name_check CHECK (login_name ~ '^[a-zA-Z0-9._-]{3,40}$');
CREATE TABLE admin_user_permissions (
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    scope VARCHAR(30) NOT NULL CHECK (scope IN ('competitions', 'teams', 'workshops', 'speakers', 'projects', 'announcements')),
    PRIMARY KEY (user_id, scope)
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_permissions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON admin_users, admin_user_permissions FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON admin_users, admin_user_permissions FROM authenticated;
    END IF;
END $$;



CREATE TABLE site_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,

    event_start_at TIMESTAMPTZ NOT NULL,
    event_end_at TIMESTAMPTZ,

    event_location_ar TEXT,
    event_location_en TEXT,

    general_registration_url TEXT NOT NULL,

    official_email VARCHAR(255) NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT site_settings_single_row
        CHECK (id = 1),

    CONSTRAINT site_settings_dates_check
        CHECK (
            event_end_at IS NULL
            OR event_end_at > event_start_at
        )
);



CREATE TABLE announcements (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,

    description_ar TEXT,
    description_en TEXT,

    image_url TEXT,

    link_url TEXT,

    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT announcements_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'in_review',
                'expired'
            )
        ),

    CONSTRAINT announcements_dates_check
        CHECK (
            start_at IS NULL
            OR end_at IS NULL
            OR end_at > start_at
        )
);




CREATE TABLE competitions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,

    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,

    category_code VARCHAR(30) NOT NULL DEFAULT 'other',

    requirements_ar TEXT,
    requirements_en TEXT,

    audience_type VARCHAR(50),

    team_size_min INTEGER,
    team_size_max INTEGER,

    max_teams INTEGER,

    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,

    registration_status VARCHAR(30) NOT NULL DEFAULT 'coming_soon',

    registration_url TEXT,

    image_url TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_order INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT competitions_category_check
        CHECK (
            category_code IN (
                'drones',
                'controller',
                'combat',
                'simulation',
                'sensing',
                'other'
            )
        ),

    CONSTRAINT competitions_registration_status_check
        CHECK (
            registration_status IN (
                'open',
                'closed',
                'coming_soon'
            )
        ),

    CONSTRAINT competitions_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'hidden'
            )
        ),

    CONSTRAINT competitions_team_size_min_check
        CHECK (
            team_size_min IS NULL
            OR team_size_min > 0
        ),

    CONSTRAINT competitions_team_size_max_check
        CHECK (
            team_size_max IS NULL
            OR team_size_max > 0
        ),

    CONSTRAINT competitions_team_size_range_check
        CHECK (
            team_size_min IS NULL
            OR team_size_max IS NULL
            OR team_size_max >= team_size_min
        ),

    CONSTRAINT competitions_max_teams_check
        CHECK (
            max_teams IS NULL
            OR max_teams > 0
        ),

    CONSTRAINT competitions_dates_check
        CHECK (
            start_at IS NULL
            OR end_at IS NULL
            OR end_at > start_at
        ),

    CONSTRAINT competitions_featured_order_check
        CHECK (
            featured_order IS NULL
            OR featured_order > 0
        )
);



CREATE TABLE competition_teams (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    competition_id INTEGER NOT NULL,

    team_name TEXT NOT NULL,

    team_leader_name TEXT NOT NULL,

    leader_email VARCHAR(255) NOT NULL,

    leader_phone VARCHAR(30) NOT NULL,

    member_names TEXT NOT NULL,

    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT competition_teams_competition_fk
        FOREIGN KEY (competition_id)
        REFERENCES competitions(id)
        ON DELETE CASCADE
);

CREATE INDEX competition_teams_competition_id_idx
    ON competition_teams (competition_id);



CREATE TABLE workshops (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,

    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,

    presenter_name TEXT,

    image_url TEXT,

    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,

    capacity INTEGER,

    available_seats INTEGER,

    registration_status VARCHAR(30) NOT NULL DEFAULT 'coming_soon',

    registration_url TEXT,

    meeting_url TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_order INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT workshops_registration_status_check
        CHECK (
            registration_status IN (
                'open',
                'closed',
                'coming_soon'
            )
        ),

    CONSTRAINT workshops_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'hidden'
            )
        ),

    CONSTRAINT workshops_capacity_check
        CHECK (
            capacity IS NULL
            OR capacity >= 0
        ),

    CONSTRAINT workshops_available_seats_check
        CHECK (
            available_seats IS NULL
            OR available_seats >= 0
        ),

    CONSTRAINT workshops_available_capacity_check
        CHECK (
            capacity IS NULL
            OR available_seats IS NULL
            OR available_seats <= capacity
        ),

    CONSTRAINT workshops_dates_check
        CHECK (
            end_at IS NULL
            OR end_at > start_at
        ),

    CONSTRAINT workshops_featured_order_check
        CHECK (
            featured_order IS NULL
            OR featured_order > 0
        )
);



-- Speaker contact details are read only through the authenticated backend.
CREATE TABLE speakers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workshop_speakers (
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workshop_id, speaker_id)
);

CREATE INDEX workshop_speakers_speaker_id_idx ON workshop_speakers (speaker_id);

-- Storage schema is present on Supabase projects. Other PostgreSQL installs
-- can omit the bucket and configure an equivalent image store separately.
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NOT NULL THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('robotactic-images', 'robotactic-images', TRUE, 5242880,
                ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[])
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_speakers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON speakers, workshop_speakers FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON speakers, workshop_speakers FROM authenticated;
    END IF;
END $$;



CREATE TABLE project_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,

    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,

    project_type VARCHAR(30) NOT NULL,

    category_id INTEGER,

    image_url TEXT,

    team_name TEXT NOT NULL,

    team_leader_name TEXT,

    project_url TEXT,

    video_url TEXT,

    technologies TEXT,

    stage_ar TEXT,
    stage_en TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_order INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT projects_category_fk
        FOREIGN KEY (category_id)
        REFERENCES project_categories(id)
        ON DELETE SET NULL,

    CONSTRAINT projects_type_check
        CHECK (
            project_type IN (
                'defense',
                'invention'
            )
        ),

    CONSTRAINT projects_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'hidden'
            )
        ),

    CONSTRAINT projects_featured_order_check
        CHECK (
            featured_order IS NULL
            OR featured_order > 0
        )
);




CREATE TABLE project_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    project_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    linkedin_url TEXT,
    x_url TEXT,

    display_order INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT project_members_project_fk
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT project_members_display_order_check
        CHECK (
            display_order IS NULL
            OR display_order > 0
        )
);



CREATE TABLE timeline_events (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,

    description_ar TEXT,
    description_en TEXT,

    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,

    location_ar TEXT,
    location_en TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'published',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT timeline_events_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'hidden'
            )
        ),

    CONSTRAINT timeline_events_dates_check
        CHECK (
            end_at > start_at
        )
);




CREATE TABLE sponsors (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name TEXT NOT NULL,

    description_ar TEXT,
    description_en TEXT,

    logo_url TEXT NOT NULL,

    sponsor_type VARCHAR(30) NOT NULL,

    level VARCHAR(50),

    website_url TEXT,

    display_order INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sponsors_type_check
        CHECK (
            sponsor_type IN (
                'sponsor',
                'partner'
            )
        ),

    CONSTRAINT sponsors_display_order_check
        CHECK (
            display_order IS NULL
            OR display_order > 0
        )
);




CREATE TABLE faqs (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,

    answer_ar TEXT NOT NULL,
    answer_en TEXT NOT NULL,

    display_order INTEGER,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT faqs_display_order_check
        CHECK (
            display_order IS NULL
            OR display_order > 0
        )
);




CREATE TABLE contact_messages (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name TEXT NOT NULL,

    email VARCHAR(255) NOT NULL,

    subject TEXT NOT NULL,

    message TEXT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'unread',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT contact_messages_status_check
        CHECK (
            status IN (
                'unread',
                'read',
                'resolved'
            )
        )
);


-- Editable public content; same additive definitions as migration 005.
CREATE TABLE IF NOT EXISTS about_page (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    title_ar TEXT NOT NULL, title_en TEXT NOT NULL,
    subtitle_ar TEXT, subtitle_en TEXT,
    body_ar TEXT NOT NULL, body_en TEXT NOT NULL,
    values_ar JSONB NOT NULL DEFAULT '[]', values_en JSONB NOT NULL DEFAULT '[]',
    image_url TEXT, image_alt_ar TEXT, image_alt_en TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (jsonb_typeof(values_ar) = 'array' AND jsonb_typeof(values_en) = 'array'),
    CHECK (image_url IS NULL OR (NULLIF(BTRIM(image_alt_ar), '') IS NOT NULL AND NULLIF(BTRIM(image_alt_en), '') IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS event_team_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    role_ar TEXT NOT NULL,
    role_en TEXT NOT NULL,
    bio_ar TEXT,
    bio_en TEXT,
    image_url TEXT,
    public_email VARCHAR(255),
    contact_url TEXT,
    linkedin_url TEXT,
    x_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO about_page (id,title_ar,title_en,subtitle_ar,subtitle_en,body_ar,body_en,values_ar,values_en,status) VALUES (1,'من نحن','About Us','تجربة متكاملة تجمع بين التنافس والتعلّم واستعراض الابتكارات في بيئة تفاعلية ملهمة.','A robotics event bringing competition, learning and innovation together.','يرتكز الملتقى على مسابقات الروبوتات التي تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، بهدف تنمية مهارات التصميم والبرمجة وحل المشكلات والعمل الجماعي والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية. ويصاحب الملتقى معرض للمشاريع والابتكارات ذات العلاقة بالقطاعات الدفاعية في المملكة.','RoboTactic brings together robotics competitions for secondary-school and university students, developing design, programming, problem-solving, teamwork and strategic thinking. The event also features a showcase of projects and innovations related to defense sectors in Saudi Arabia.','["الابتكار والإبداع", "التفكير الاستراتيجي", "التميّز والجودة", "الاحترافية", "التعاون والعمل الجماعي"]'::jsonb,'["Innovation and creativity","Strategic thinking","Excellence and quality","Professionalism","Collaboration and teamwork"]'::jsonb,'published') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public_section_visibility (
    section_key VARCHAR(30) PRIMARY KEY
        CHECK (section_key IN ('competitions', 'workshops', 'projects', 'announcements', 'about', 'team', 'timeline')),
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public_section_visibility (section_key)
VALUES ('competitions'), ('workshops'), ('projects'), ('announcements'), ('about'), ('team'), ('timeline')
ON CONFLICT (section_key) DO NOTHING;


CREATE TABLE public.schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);

-- Migration: 001_workshop_speakers.sql
-- Additive migration. Existing workshop and participant records are preserved.
ALTER TABLE workshops ALTER COLUMN presenter_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS speakers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workshop_speakers (
    workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workshop_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS workshop_speakers_speaker_id_idx ON workshop_speakers (speaker_id);

INSERT INTO public.schema_migrations(name) VALUES ('001_workshop_speakers.sql');

-- Migration: 002_protect_workshop_contacts.sql
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

INSERT INTO public.schema_migrations(name) VALUES ('002_protect_workshop_contacts.sql');

-- Migration: 003_public_image_bucket.sql
-- Supabase Storage bucket for public event images. Uploads still require
-- the server-only service role key and the authenticated admin endpoint.
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NOT NULL THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'robotactic-images',
            'robotactic-images',
            TRUE,
            5242880,
            ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

INSERT INTO public.schema_migrations(name) VALUES ('003_public_image_bucket.sql');

-- Migration: 004_admin_account_permissions.sql
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS login_name VARCHAR(40);
UPDATE admin_users
SET login_name = REPLACE(role_code, '_', '-') || '-' || id
WHERE login_name IS NULL;
ALTER TABLE admin_users ALTER COLUMN login_name SET NOT NULL;
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_login_name_key;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_login_name_key UNIQUE (login_name);
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_login_name_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_login_name_check CHECK (login_name ~ '^[a-zA-Z0-9._-]{3,40}$');
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role_code IN ('super_admin', 'competition_manager', 'workshop_manager', 'team_member'));

CREATE TABLE IF NOT EXISTS admin_user_permissions (
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    scope VARCHAR(30) NOT NULL CHECK (scope IN ('competitions', 'teams', 'workshops', 'speakers', 'projects', 'announcements')),
    PRIMARY KEY (user_id, scope)
);

INSERT INTO admin_user_permissions (user_id, scope)
SELECT id, scope FROM admin_users
CROSS JOIN LATERAL unnest(CASE role_code
    WHEN 'competition_manager' THEN ARRAY['competitions', 'teams']
    WHEN 'workshop_manager' THEN ARRAY['workshops', 'speakers']
    ELSE ARRAY[]::TEXT[] END) AS scope
ON CONFLICT DO NOTHING;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_permissions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON admin_users, admin_user_permissions FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON admin_users, admin_user_permissions FROM authenticated;
    END IF;
END $$;

INSERT INTO public.schema_migrations(name) VALUES ('004_admin_account_permissions.sql');

-- Migration: 005_about_team_content.sql
CREATE TABLE IF NOT EXISTS about_page (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    title_ar TEXT NOT NULL, title_en TEXT NOT NULL,
    subtitle_ar TEXT, subtitle_en TEXT,
    body_ar TEXT NOT NULL, body_en TEXT NOT NULL,
    values_ar JSONB NOT NULL DEFAULT '[]', values_en JSONB NOT NULL DEFAULT '[]',
    image_url TEXT, image_alt_ar TEXT, image_alt_en TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (jsonb_typeof(values_ar) = 'array' AND jsonb_typeof(values_en) = 'array'),
    CHECK (image_url IS NULL OR (NULLIF(BTRIM(image_alt_ar), '') IS NOT NULL AND NULLIF(BTRIM(image_alt_en), '') IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS event_team_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    role_ar TEXT NOT NULL,
    role_en TEXT NOT NULL,
    bio_ar TEXT,
    bio_en TEXT,
    image_url TEXT,
    public_email VARCHAR(255),
    contact_url TEXT,
    linkedin_url TEXT,
    x_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO about_page (id,title_ar,title_en,subtitle_ar,subtitle_en,body_ar,body_en,values_ar,values_en,status) VALUES (1,'عن الملتقى','About RoboTactic','تجربة متكاملة تجمع بين التنافس والتعلّم واستعراض الابتكارات في بيئة تفاعلية ملهمة.','A robotics event bringing competition, learning and innovation together.','يرتكز الملتقى على مسابقات الروبوتات التي تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، بهدف تنمية مهارات التصميم والبرمجة وحل المشكلات والعمل الجماعي والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية. ويصاحب الملتقى معرض للمشاريع والابتكارات ذات العلاقة بالقطاعات الدفاعية في المملكة.','RoboTactic brings together robotics competitions for secondary-school and university students, developing design, programming, problem-solving, teamwork and strategic thinking. The event also features a showcase of projects and innovations related to defense sectors in Saudi Arabia.','["الابتكار والإبداع", "التفكير الاستراتيجي", "التميّز والجودة", "الاحترافية", "التعاون والعمل الجماعي"]'::jsonb,'["Innovation and creativity","Strategic thinking","Excellence and quality","Professionalism","Collaboration and teamwork"]'::jsonb,'published') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.schema_migrations(name) VALUES ('005_about_team_content.sql');

-- Migration: 006_competition_tracks.sql
-- Confirmed track names only. Descriptions, team sizes and dates remain editable
-- in the dashboard; no dates or participation requirements have been announced.
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_category_check;
ALTER TABLE competitions ADD CONSTRAINT competitions_category_check
    CHECK (category_code IN ('drones', 'controller', 'sensing', 'combat', 'simulation', 'other'));

-- Preserve existing records, registration links and scheduling. Rename only
-- the previous official tracks, leaving unrelated and demo content untouched.
UPDATE competitions SET name_ar = 'Sensors', name_en = 'Sensors', category_code = 'sensing', updated_at = CURRENT_TIMESTAMP
WHERE name_en = 'University Robotics Competition' OR name_ar = 'مسابقة الروبوتات الجامعية';
UPDATE competitions SET name_ar = 'Controller', name_en = 'Controller', category_code = 'controller', updated_at = CURRENT_TIMESTAMP
WHERE name_en = 'Secondary and Beginners Competition' OR name_ar IN ('مسابقة الثانوي / المبتدئين', 'مسابقة الثانوي والمبتدئين');
UPDATE competitions SET name_ar = 'Drones', name_en = 'Drones', category_code = 'drones', updated_at = CURRENT_TIMESTAMP
WHERE name_en IN ('CanSat and Rockets Challenge', 'CanSat / Rockets') OR name_ar IN ('كانسات / الصواريخ', 'تحدي كانسات والصواريخ');

INSERT INTO competitions (name_ar, name_en, description_ar, description_en,
    category_code, registration_status, status, is_featured, featured_order)
SELECT track.name, track.name, 'سيُعلن وصف المسابقة وتفاصيلها لاحقًا.',
    'The competition description and details will be announced later.',
    track.category, 'coming_soon', 'published', TRUE, track.position
FROM (VALUES ('Drones', 'drones', 1), ('Controller', 'controller', 2), ('Sensors', 'sensing', 3))
    AS track(name, category, position)
WHERE NOT EXISTS (SELECT 1 FROM competitions c WHERE LOWER(c.name_en) = LOWER(track.name));

UPDATE about_page SET title_ar = 'من نحن', updated_at = CURRENT_TIMESTAMP WHERE title_ar = 'عن الملتقى';
UPDATE about_page SET title_en = 'About Us', updated_at = CURRENT_TIMESTAMP WHERE title_en IN ('About RoboTactic', 'About');

INSERT INTO public.schema_migrations(name) VALUES ('006_competition_tracks.sql');

-- Migration: 007_public_section_visibility.sql
CREATE TABLE IF NOT EXISTS public_section_visibility (
    section_key VARCHAR(30) PRIMARY KEY
        CHECK (section_key IN ('competitions', 'workshops', 'projects', 'announcements', 'about', 'team', 'timeline')),
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public_section_visibility (section_key)
VALUES ('competitions'), ('workshops'), ('projects'), ('announcements'), ('about'), ('team'), ('timeline')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.schema_migrations(name) VALUES ('007_public_section_visibility.sql');

-- Runtime login remains disabled until reviewed and a password is set privately.
-- REVIEWED PROPOSAL ONLY. Run manually as the database administrator AFTER approval.
-- No password, data changes, administrative role grants, or automatic migration hook.
-- Existing role => fail; never silently modify an existing identity.

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

-- Keep NOLOGIN while grants and effective permissions are reviewed.
-- Then, in psql over verified TLS, use these interactively AFTER approval:
--   SET password_encryption = 'scram-sha-256';
--   \password robotactic_app
--   ALTER ROLE robotactic_app LOGIN;
-- Never put the password in a SQL statement, connection CLI argument, or Git.

-- REVIEWED PROPOSAL ONLY: execute manually AFTER approval and createRuntimeRole.sql.
-- Explicit tables/columns only. No default grants, role memberships or data changes.
-- Keep robotactic_app NOLOGIN until the separate read-only audit passes.

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
