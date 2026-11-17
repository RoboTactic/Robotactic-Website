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

-- Migration: 008_competition_supervisors.sql
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

INSERT INTO public.schema_migrations(name) VALUES ('008_competition_supervisors.sql');

-- Migration: 009_site_settings_row.sql
-- The dashboard edits the single site_settings row (id = 1) but never creates it.
-- Ensure it exists with no start time, so the team can set the date from the dashboard.
-- The public countdown already treats a missing start time as "not announced".
ALTER TABLE site_settings ALTER COLUMN event_start_at DROP NOT NULL;
ALTER TABLE site_settings ALTER COLUMN general_registration_url DROP NOT NULL;
ALTER TABLE site_settings ALTER COLUMN official_email DROP NOT NULL;

INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.schema_migrations(name) VALUES ('009_site_settings_row.sql');

-- Migration: 010_team_structure.sql
-- Additive migration. The organizing team's departments, their leaders, committees and committee
-- members, managed from the dashboard (Super Admin only). Public names and titles only: no photos,
-- contact details or other personal data. Seeded once with the structure previously kept in
-- frontend/src/data/team.js; repeating the seed never overwrites dashboard edits.
CREATE TABLE IF NOT EXISTS team_departments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    icon VARCHAR(30) NOT NULL,
    name_ar TEXT NOT NULL CHECK (char_length(BTRIM(name_ar)) BETWEEN 1 AND 200),
    name_en TEXT NOT NULL CHECK (char_length(BTRIM(name_en)) BETWEEN 1 AND 200),
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_department_leaders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES team_departments(id) ON DELETE CASCADE,
    role_ar TEXT NOT NULL CHECK (char_length(BTRIM(role_ar)) BETWEEN 1 AND 100),
    role_en TEXT NOT NULL CHECK (char_length(BTRIM(role_en)) BETWEEN 1 AND 100),
    name_ar TEXT NOT NULL CHECK (char_length(BTRIM(name_ar)) BETWEEN 1 AND 200),
    name_en TEXT NOT NULL CHECK (char_length(BTRIM(name_en)) BETWEEN 1 AND 200),
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- is_general marks a department's members who belong to no committee (listed as «أعضاء القسم»).
CREATE TABLE IF NOT EXISTS team_committees (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES team_departments(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL CHECK (char_length(BTRIM(name_ar)) BETWEEN 1 AND 200),
    name_en TEXT NOT NULL CHECK (char_length(BTRIM(name_en)) BETWEEN 1 AND 200),
    is_general BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- is_lead rows (supervisors, vice supervisors, group leaders) are highlighted with their role.
CREATE TABLE IF NOT EXISTS team_committee_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    committee_id INTEGER NOT NULL REFERENCES team_committees(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL CHECK (char_length(BTRIM(name_ar)) BETWEEN 1 AND 200),
    name_en TEXT NOT NULL CHECK (char_length(BTRIM(name_en)) BETWEEN 1 AND 200),
    role_ar TEXT CHECK (role_ar IS NULL OR char_length(BTRIM(role_ar)) BETWEEN 1 AND 100),
    role_en TEXT CHECK (role_en IS NULL OR char_length(BTRIM(role_en)) BETWEEN 1 AND 100),
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((role_ar IS NULL) = (role_en IS NULL)),
    CHECK (NOT is_lead OR role_ar IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS team_department_leaders_department_id_idx ON team_department_leaders (department_id);
CREATE INDEX IF NOT EXISTS team_committees_department_id_idx ON team_committees (department_id);
CREATE INDEX IF NOT EXISTS team_committee_members_committee_id_idx ON team_committee_members (committee_id);

-- Reads go through the backend only; keep Supabase Data API roles out.
ALTER TABLE team_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_department_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_committee_members ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON team_departments, team_department_leaders, team_committees, team_committee_members FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON team_departments, team_department_leaders, team_committees, team_committee_members FROM authenticated;
    END IF;
END $$;

DO $seed$
DECLARE dept_id INTEGER; committee_id INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM team_departments) THEN RETURN; END IF;

    -- Ambassadors Department
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('globe', 'قسم السفراء', 'Ambassadors Department', 1) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'عبدالعزيز الزهراني', 'Abdulaziz Alzahrani', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'حلا عسيري', 'Hala Asiri', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'أعضاء القسم', 'Department Members', TRUE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'جنى زيد المالكي', 'Jana Zaid Almalki', NULL, NULL, FALSE, 1),
        (committee_id, 'لجين سامي الأحمدي', 'Lujain S Alahmadi', NULL, NULL, FALSE, 2),
        (committee_id, 'مهند عطيه اللحياني', 'Mohaned Ateya Allhyani', NULL, NULL, FALSE, 3);

    -- Media & Marketing
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('megaphone', 'قسم التسويق', 'Media & Marketing', 2) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'أسماء وهيب', 'Asmaa Waheeb', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'رزان السلمي', 'Razan Alsulami', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة التصميم', 'Design', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'هديل مسلم الطويرقي', 'Hadeel Muslim Al Twairqi', NULL, NULL, FALSE, 1),
        (committee_id, 'خلود خالد الكريدمي', 'Khulud Khalid Alkraydmi', NULL, NULL, FALSE, 2),
        (committee_id, 'تهاني ماجد الغامدي', 'Tahani Majed Alghamdi', NULL, NULL, FALSE, 3),
        (committee_id, 'بيان عبدالله العتيبي', 'Bayan Abdullah Alotaibi', NULL, NULL, FALSE, 4),
        (committee_id, 'جنى غازي العتيبي', 'Jana Ghazi Alotaibi', NULL, NULL, FALSE, 5),
        (committee_id, 'يارا علي القرني', 'Yara Ali Alqarni', NULL, NULL, FALSE, 6),
        (committee_id, 'مها ماجد صدام', 'Maha Majed Saddam', NULL, NULL, FALSE, 7),
        (committee_id, 'رنيم هشام بامفلح', 'Raneem Hisham Bamufleh', NULL, NULL, FALSE, 8);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة التسويق', 'Marketing', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ليندا صالح المنهالي', 'Linda Saleh Alminhali', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'حنان عبدالحي محمد', 'Hanan Abdulhai Mohammed', NULL, NULL, FALSE, 2),
        (committee_id, 'طيف حافظ الجهوري', 'Taif Hafiz Aljahwari', NULL, NULL, FALSE, 3),
        (committee_id, 'نوره ياسر القحطاني', 'Noura Yaseer Alqatani', NULL, NULL, FALSE, 4),
        (committee_id, 'بيان عطيه المالكي', 'Bayan Atiah Almalki', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الرصد الإعلامي', 'Media Monitoring', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ضياء صالح دبيس', 'Deyya Saleh Dobais', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'احمد انوار الحق رشيد', 'Ahmed Anwarulahq Rasheed', NULL, NULL, FALSE, 2),
        (committee_id, 'يارا محمد الغامدي', 'Yara Mohammed Alghamdi', NULL, NULL, FALSE, 3),
        (committee_id, 'دانة خالد الطاسان', 'Danah Khalid Altasan', NULL, NULL, FALSE, 4),
        (committee_id, 'ليان خالد القرني', 'Layan Khalid Alqarni', NULL, NULL, FALSE, 5),
        (committee_id, 'رغد عوض المرامحي', 'Raghad Awad Almramihi', NULL, NULL, FALSE, 6),
        (committee_id, 'ريفال خالد النفيسى', 'Refal Khalid Alnafisi', NULL, NULL, FALSE, 7);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الإعلام', 'Media', FALSE, 4) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ايناس سالم العتيبي', 'Enas Salem Alotaibi', NULL, NULL, FALSE, 1),
        (committee_id, 'الهام عاضه الحارثي', 'Elham Aaddh Alharthi', NULL, NULL, FALSE, 2),
        (committee_id, 'غسق عدنان بخش', 'Ghasaq Bakhsh', NULL, NULL, FALSE, 3),
        (committee_id, 'جوري عبدالله خلاف', 'Joury Abdullah Khallaf', NULL, NULL, FALSE, 4),
        (committee_id, 'تولين محمود تعباني', 'Tuleen Mahmoud Tabaani', NULL, NULL, FALSE, 5);

    -- Planning Department
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('route', 'قسم التخطيط', 'Planning Department', 3) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'زينب عبدالحليم', 'Zainab Abdulhalim', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'جوري الغامدي', 'Juri Alghamdi', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة المسابقات الرئيسية', 'Main Competitions', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'حمزه عادل ابوعسكر', 'Hamzah Adel AbuAskar', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'تولين فواز مريعاني', 'Toleen Fawaz Mereani', NULL, NULL, FALSE, 2),
        (committee_id, 'شادن حسين البارقي', 'Shaden Hussain Albargi', NULL, NULL, FALSE, 3),
        (committee_id, 'يوسف رائد باعشن', 'Yousef Raed Baeshen', NULL, NULL, FALSE, 4),
        (committee_id, 'لبنى محمد هديش', 'Lubna Mohmmed Hedeesh', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الفصل بين الطلاب والطالبات', 'Male & Female Student Sections', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'تميم محمد المزروعي', 'Tamim Mohammed Almazrui', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'أميره مناحي البقمي', 'Amirah Manahi Albuqami', NULL, NULL, FALSE, 2),
        (committee_id, 'ليان ابراهيم بهكلي', 'Layan Ibrahim Bahkali', NULL, NULL, FALSE, 3),
        (committee_id, 'سعد فهد الغامدي', 'Saad Fahd Alghamdi', NULL, NULL, FALSE, 4),
        (committee_id, 'وسن إبراهيم الحربي', 'Wasan Ibrahim Alharbi', NULL, NULL, FALSE, 5),
        (committee_id, 'رغد نايف العساف', 'Raghad Naif Alassaf', NULL, NULL, FALSE, 6);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة معرض المشاريع الدفاعية', 'Defense Projects Exhibition', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'عبدالعزيز سعيد القحطاني', 'Abdulaziz Saeed Alqahtani', NULL, NULL, FALSE, 1),
        (committee_id, 'منار عتقى الجهني', 'Manar Etga Aljehani', NULL, NULL, FALSE, 2),
        (committee_id, 'حنان علي الجهني', 'Hanan Ali Aljehani', NULL, NULL, FALSE, 3),
        (committee_id, 'شهد مديس المالكي', 'Shahad Mudays Almalki', NULL, NULL, FALSE, 4),
        (committee_id, 'نهى محمد الصابوني', 'Nuha Mohammed Sabouni', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة معرض الابتكارات والاختراعات', 'Innovations & Inventions Exhibition', FALSE, 4) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'بدر علي القحطاني', 'Bader Ali Alqahtani', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'ريان مختار العريشي', 'Rayan Mukhtar Alarishi', 'المشرف', 'Supervisor', TRUE, 2),
        (committee_id, 'لينا سعيد الغامدي', 'Leena Saeed Alghamdi', NULL, NULL, FALSE, 3),
        (committee_id, 'ذكرى الغامدي', 'Thikra Alghamdi', NULL, NULL, FALSE, 4),
        (committee_id, 'رغد خالد الزهراني', 'Raghad Khaled Alzahrani', NULL, NULL, FALSE, 5),
        (committee_id, 'جمانة ابراهيم النهدي', 'Jumanah Ibrahim Alnahdi', NULL, NULL, FALSE, 6),
        (committee_id, 'جود سليمان ميمني', 'Jood Sulaiman Maimani', NULL, NULL, FALSE, 7);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الحفل الختامي', 'Closing Ceremony', FALSE, 5) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'تولين محمود العطوي', 'Tulin Mahmoud Alatawe', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'ريماس محمد مصلوف', 'Remas Muhmmad Mslwf', NULL, NULL, FALSE, 2),
        (committee_id, 'سارة القحطاني', 'Sara Alqahtani', NULL, NULL, FALSE, 3),
        (committee_id, 'لين لواء بخاري', 'Leen Lewaa Bukhari', NULL, NULL, FALSE, 4),
        (committee_id, 'انمار بندر باصمد', 'Anmar Bandar Basamad', NULL, NULL, FALSE, 5);

    -- Programs Department
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('calendar', 'قسم البرامج', 'Programs Department', 4) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'قائد', 'Program Leader', 'موضي القرعاوي', 'Moudi Algarawi', 1),
        (dept_id, 'قائد', 'Program Leader', 'عبدالله السلمي', 'Abdullah Alsulami', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الورش الحضورية', 'In-Person Workshops', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'بدر فهد الجعيد', 'Badr Fahad Aljuaid', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'رغد عبدالكريم بن جحلان', 'Raghad Abdulkarim Bin Jahlan', NULL, NULL, FALSE, 2),
        (committee_id, 'شهد منصور هزازي', 'Shahad Mansour Hazzazi', NULL, NULL, FALSE, 3),
        (committee_id, 'جوري خالد الصبحي', 'Jury Khaled Alsubhi', NULL, NULL, FALSE, 4),
        (committee_id, 'غلا فيصل زميم', 'Ghala Faisal Zameem', NULL, NULL, FALSE, 5),
        (committee_id, 'ميرال سامر جاوي', 'Meral Samer Jawi', NULL, NULL, FALSE, 6),
        (committee_id, 'شذى عمر باعربي', 'Shatha Omar Baarabi', NULL, NULL, FALSE, 7),
        (committee_id, 'لارا خالد الحميدي', 'Lara Khaled Alhamidi', NULL, NULL, FALSE, 8);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة البرمجان', 'Hackathon', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'الهنوف فهد ابوعلي', 'Alhanouf Fahad AbuAli', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'اصايل عبدالله اللحياني', 'Asayl Abdullah Allhyani', 'نائب المشرف', 'Vice Supervisor', TRUE, 2),
        (committee_id, 'داليا خضر فروان', 'Dalia Khader Farwan', NULL, NULL, FALSE, 3),
        (committee_id, 'شهد عبدالله الحربي', 'Shahad Abdullah Alharbi', NULL, NULL, FALSE, 4),
        (committee_id, 'دانه عبدالله القحطاني', 'Dana Abdullah Alqahtani', NULL, NULL, FALSE, 5),
        (committee_id, 'سيرين عبدالرحمن القرني', 'Seren Abdulrhman Alqarni', NULL, NULL, FALSE, 6),
        (committee_id, 'اسماء عبدالرحمن العطاس', 'Asma Abdulrahman Alattas', NULL, NULL, FALSE, 7),
        (committee_id, 'علي حسن الفار', 'Ali Hassan Alfar', NULL, NULL, FALSE, 8),
        (committee_id, 'جنى زامل الشمراني', 'Jana Zamil Alshamrani', NULL, NULL, FALSE, 9);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الترفيه', 'Entertainment', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'جود محمد العتيبي', 'Joud Mohammad Altaibi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'رينا محمد ديان', 'Rina Mohammed Deyan', NULL, NULL, FALSE, 2),
        (committee_id, 'جوري خالد العمودي', 'Jori Khalid Alamoudi', NULL, NULL, FALSE, 3),
        (committee_id, 'غلا عبدالعزيز المطيري', 'Ghala Abdulaziz Al Mutairi', NULL, NULL, FALSE, 4),
        (committee_id, 'عبدالله خليف الحربي', 'Abdullah Khulaif Alharbi', NULL, NULL, FALSE, 5),
        (committee_id, 'جنا ناصر الظاهري', 'Jana Naser Aldhahery', NULL, NULL, FALSE, 6);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة المتحدثين', 'Speakers', FALSE, 4) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'دانه اديب الدوسري', 'Danah Adeeb Aldawsari', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'تالا أحمد الغامدي', 'Tala Ahmed Alghamdi', NULL, NULL, FALSE, 2),
        (committee_id, 'رنا ياسر طاهر', 'Rana Yaser Taher', NULL, NULL, FALSE, 3),
        (committee_id, 'جنى علي الغامدي', 'Jana Ali Alghamdi', NULL, NULL, FALSE, 4),
        (committee_id, 'ريتاج عبدالله العدواني', 'Retaj Abdullah Aladwani', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الورش عن بعد', 'Remote Workshops', FALSE, 5) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'مياس طلال الحربي', 'Mayas Talal Alharbi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'ميان عبدالله المزين', 'Mayan Abdullah Almuzayn', NULL, NULL, FALSE, 2),
        (committee_id, 'عائشة عيدروس شهاب', 'Aishah Aidarus Shihab', NULL, NULL, FALSE, 3),
        (committee_id, 'جمانة خالد النفيعي', 'Jumana Khaled Alnefaie', NULL, NULL, FALSE, 4),
        (committee_id, 'ديما عبدالهادي الجهني', 'Deema Abdulhadi Aljehani', NULL, NULL, FALSE, 5),
        (committee_id, 'دانه موسى المزروعي', 'Danah Moosa Almazroui', NULL, NULL, FALSE, 6);

    -- Human Resources
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('users', 'قسم الموارد البشرية', 'Human Resources', 5) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'رنده بخاري', 'Randa Bukhari', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'تالا جبريل', 'Tala Jabril', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الاستقطاب والتطوع', 'Recruitment & Volunteering', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'وسن محمد القحطاني', 'Wasan Mohammed Alqahtani', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'حلا سعد المطيري', 'Hala Saad Almutairi', NULL, NULL, FALSE, 2),
        (committee_id, 'ريم موسى الامير', 'Reem Mousa Alamir', NULL, NULL, FALSE, 3),
        (committee_id, 'ساره فايز الجهني', 'Sara Fayez Aljehani', NULL, NULL, FALSE, 4);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة التدريب والتطوير', 'Training & Development', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ليان احمد الغامدي', 'Layan Ahmed Alghamdi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'رميز فهد عشري', 'Rameez Fahad Ashri', NULL, NULL, FALSE, 2),
        (committee_id, 'رغد رشدي صقر', 'Raghad Rushdi Saqer', NULL, NULL, FALSE, 3),
        (committee_id, 'نواف عمر الغامدي', 'Nawaf Omar Alghamdi', NULL, NULL, FALSE, 4);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الجدولة والمناوبات والحضور', 'Scheduling, Shifts & Attendance', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ليان محمد صيقل', 'Layan Mohammed Saigal', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'ليان فايق حناوي', 'Layan Faiq Hennawi', NULL, NULL, FALSE, 2),
        (committee_id, 'ميار اسامه منصوري', 'Mayar Osama Mansouri', NULL, NULL, FALSE, 3);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الفرز والمقابلات والتوزيع', 'Screening, Interviews & Placement', FALSE, 4) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'الاء علي آل عيد', 'Alaa Ali Al Eid', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'رانية عادل الزهراني', 'Raniah Adel Alzahrani', NULL, NULL, FALSE, 2),
        (committee_id, 'مها سامر سلطان', 'Maha Samer Sultan', NULL, NULL, FALSE, 3),
        (committee_id, 'رجاوي خالد الجلسي', 'Rajawi Khaled Aljalsi', NULL, NULL, FALSE, 4),
        (committee_id, 'رزان احمد الطيب', 'Razan Ahmad Altayyeb', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة التحفيز والتكريم', 'Motivation & Recognition', FALSE, 5) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'فهد بندر العوفي', 'Fahad Bandar AlOufi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'ريفان عبدالعزيز الحذيفي', 'Refan Abdulaziz Alhuzaifi', NULL, NULL, FALSE, 2),
        (committee_id, 'ريلام محمد كردي', 'Relam Mohammed Kurdi', NULL, NULL, FALSE, 3),
        (committee_id, 'ريم علي الروقي', 'Reem Ali Alruqi', NULL, NULL, FALSE, 4),
        (committee_id, 'نواف فهد ناصر الجعيد', 'Nawaf Fahad Nasser Aljuaid', NULL, NULL, FALSE, 5);

    -- Technical Department
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('chip', 'القسم التقني', 'Technical Department', 6) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'ريماس محمود', 'Rimas Mahmoud', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'ليان المتعب', 'Layan Al Meteb', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'اللجنة الهندسية', 'Engineering Committee', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'المهدي محمد صيرفي', 'Almahdi Mohammed Sairafi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'وسام محمد حلواني', 'Wesam Mohammed Halawani', NULL, NULL, FALSE, 2),
        (committee_id, 'معتز عمرو الحجازي', 'Motaz Amro Alhejazi', NULL, NULL, FALSE, 3),
        (committee_id, 'ليان عايض القرني', 'Layan Ayed Alqarni', NULL, NULL, FALSE, 4),
        (committee_id, 'فاطمه سراج الزهراني', 'Fatima Siraj Alzahrani', NULL, NULL, FALSE, 5),
        (committee_id, 'جنى فيصل النشيري', 'Jana Faisal Alnushayri', NULL, NULL, FALSE, 6),
        (committee_id, 'جوري باسم مصلي', 'Jory Basim Musalli', NULL, NULL, FALSE, 7),
        (committee_id, 'راشد ياسر الدوسري', 'Rashed Yasser Al Dosari', NULL, NULL, FALSE, 8),
        (committee_id, 'ريوف حاتم الجعيد', 'Reoof Hatem Aljuaid', NULL, NULL, FALSE, 9);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة مسابقة المتقدمين', 'Advanced Competition', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'رنا ماهر المصباحي', 'Rana Maher Almisbahi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'براءة ايمن احمد', 'Braah Aymen Ahmed', NULL, NULL, FALSE, 2),
        (committee_id, 'ريتال جابر الجعيد', 'Retal Jaber Aljuaid', NULL, NULL, FALSE, 3),
        (committee_id, 'عبدالاله علي بن حمد', 'Abdulelah Ali Binhimd', NULL, NULL, FALSE, 4),
        (committee_id, 'عبدالرحمن صالح الحربي', 'Abdulrahman Saleh Alharbi', NULL, NULL, FALSE, 5),
        (committee_id, 'دانة احمد الجدعاني', 'Danah Ahmed Algdaani', NULL, NULL, FALSE, 6),
        (committee_id, 'هاشم اسامه سيت', 'Hashim Osama Sait', NULL, NULL, FALSE, 7),
        (committee_id, 'محمد علي سلت', 'Mohammed Ali Salat', NULL, NULL, FALSE, 8),
        (committee_id, 'ضي فهد الغامدي', 'Daee Fahad Alghamdi', NULL, NULL, FALSE, 9);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة مسابقة المبتدئين', 'Beginner Competition', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'كرم عصام مغربل', 'Karam Essam Mugharbel', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'فارس بكر فلاته', 'Faris Bakr Fallatah', NULL, NULL, FALSE, 2),
        (committee_id, 'سلاف عادل الأحمدي', 'Solaf Adel Alahmadi', NULL, NULL, FALSE, 3),
        (committee_id, 'صالح احمد اللهيب', 'Saleh Ahmed Allhieb', NULL, NULL, FALSE, 4),
        (committee_id, 'نواف وائل خضري', 'Nawaf Wael Khudary', NULL, NULL, FALSE, 5),
        (committee_id, 'ليان علي الشهري', 'Layan Ali Alshehri', NULL, NULL, FALSE, 6),
        (committee_id, 'رهف عبد العزيز المغربي', 'Rahaf Abdulaziz Almghrabi', NULL, NULL, FALSE, 7),
        (committee_id, 'لارا خالد التميمي', 'Lara Khalid Altamimi', NULL, NULL, FALSE, 8),
        (committee_id, 'محمد ايمن السيد', 'Muhammed Ayman Alsayed', NULL, NULL, FALSE, 9),
        (committee_id, 'ليان عبدالملك الزهراني', 'Layan Abdulmalik Alzhrani', NULL, NULL, FALSE, 10);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الموقع', 'Website Committee', FALSE, 4) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'عبد الله السيروان', 'Abdullah Alseyrawan', 'القائد · الباك إند', 'Leader · Back-end', TRUE, 1),
        (committee_id, 'صالح باحكيم', 'Saleh Bahakim', NULL, NULL, FALSE, 2),
        (committee_id, 'ليان الحربي', 'Layan Alharbi', 'القائد · الفرونت إند', 'Leader · Front-end', TRUE, 3),
        (committee_id, 'معتز السيد', 'Motaz Alsayed', NULL, NULL, FALSE, 4),
        (committee_id, 'شيماء وهيب', 'Shaima Waheeb', NULL, NULL, FALSE, 5);

    -- Public Relations
    INSERT INTO team_departments (icon, name_ar, name_en, display_order) VALUES ('chat', 'قسم العلاقات العامة', 'Public Relations', 7) RETURNING id INTO dept_id;
    INSERT INTO team_department_leaders (department_id, role_ar, role_en, name_ar, name_en, display_order) VALUES
        (dept_id, 'القائد', 'Leader', 'عبدالرحمن رجب', 'Abdulrahman Rajab', 1),
        (dept_id, 'نائب القائد', 'Vice-Leader', 'وليد زكي', 'Waleed Zaki', 2);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الرعايات', 'Sponsorships', FALSE, 1) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'شهد عبداللطيف الصبحي', 'Shahad Abdullatif Alsubhi', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'مها حسين اليامي', 'Maha Hussain Alyami', NULL, NULL, FALSE, 2),
        (committee_id, 'عمر محمد الغامدي', 'Omar Mohammed Alghamdi', NULL, NULL, FALSE, 3),
        (committee_id, 'مهنا خالد السلمي', 'Muhanna Khaled Alsulami', NULL, NULL, FALSE, 4),
        (committee_id, 'جمانه احمد عويضه', 'Jomana Ahmad Owaida', NULL, NULL, FALSE, 5),
        (committee_id, 'احلام محمد حدادي', 'Ahlam Mohammed Haddadi', NULL, NULL, FALSE, 6),
        (committee_id, 'فارس صديق نورالهي', 'Faris Saddiq Noor Elahi', NULL, NULL, FALSE, 7),
        (committee_id, 'رهام صالح عثمان', 'Reham Saleh Othman', NULL, NULL, FALSE, 8),
        (committee_id, 'لورا خالد الحريري', 'Laura Khaled Alhariri', NULL, NULL, FALSE, 9);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة الضيوف والدعوات', 'Guests & Invitations', FALSE, 2) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'ليان عمر البقمي', 'Layan Omar Albuqami', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'لين حامد الشطيري', 'Leen Hamed Alshatiri', NULL, NULL, FALSE, 2),
        (committee_id, 'سعود عبدالله ال الحارث', 'Saud Abdullah Al Alhareth', NULL, NULL, FALSE, 3),
        (committee_id, 'رحمت الله عبدالقهار مولاداد الرحماني', 'Rahmatullah AbdulQahar Mouladad Rahmani', NULL, NULL, FALSE, 4),
        (committee_id, 'شروق حسن حكمي', 'Shroog Hasan Hakami', NULL, NULL, FALSE, 5);
    INSERT INTO team_committees (department_id, name_ar, name_en, is_general, display_order) VALUES (dept_id, 'لجنة التصاريح', 'Permits', FALSE, 3) RETURNING id INTO committee_id;
    INSERT INTO team_committee_members (committee_id, name_ar, name_en, role_ar, role_en, is_lead, display_order) VALUES
        (committee_id, 'محمد احمد جستنيه', 'Mohammed Ahmad Justanieah', 'المشرف', 'Supervisor', TRUE, 1),
        (committee_id, 'شادي محمد برناوي', 'Shadi Mohammed Brnawi', NULL, NULL, FALSE, 2),
        (committee_id, 'غلا عادل الجحدلي', 'Ghala Adel Aljahdali', NULL, NULL, FALSE, 3),
        (committee_id, 'أحمد علي أحمد الزبيدي', 'Ahmed Ali Ahmed Alzubaidi', NULL, NULL, FALSE, 4);
END
$seed$;

INSERT INTO public.schema_migrations(name) VALUES ('010_team_structure.sql');

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

GRANT SELECT ON TABLE public."competition_supervisors" TO robotactic_app;
GRANT INSERT ("competition_id", "name_ar", "name_en", "title_ar", "title_en", "linkedin_url", "display_order") ON TABLE public."competition_supervisors" TO robotactic_app;
GRANT DELETE ON TABLE public."competition_supervisors" TO robotactic_app;

GRANT SELECT ON TABLE public."site_settings" TO robotactic_app;
GRANT UPDATE ("event_start_at", "updated_at") ON TABLE public."site_settings" TO robotactic_app;

GRANT SELECT ON TABLE public."about_page" TO robotactic_app;
GRANT UPDATE ("title_ar", "title_en", "subtitle_ar", "subtitle_en", "body_ar", "body_en", "values_ar", "values_en", "image_url", "image_alt_ar", "image_alt_en", "status", "updated_at") ON TABLE public."about_page" TO robotactic_app;

GRANT SELECT ON TABLE public."team_departments" TO robotactic_app;
GRANT INSERT ("icon", "name_ar", "name_en", "display_order") ON TABLE public."team_departments" TO robotactic_app;
GRANT UPDATE ("icon", "name_ar", "name_en", "display_order", "updated_at") ON TABLE public."team_departments" TO robotactic_app;
GRANT DELETE ON TABLE public."team_departments" TO robotactic_app;

GRANT SELECT ON TABLE public."team_department_leaders" TO robotactic_app;
GRANT INSERT ("department_id", "role_ar", "role_en", "name_ar", "name_en", "display_order") ON TABLE public."team_department_leaders" TO robotactic_app;
GRANT UPDATE ("role_ar", "role_en", "name_ar", "name_en", "display_order", "updated_at") ON TABLE public."team_department_leaders" TO robotactic_app;
GRANT DELETE ON TABLE public."team_department_leaders" TO robotactic_app;

GRANT SELECT ON TABLE public."team_committees" TO robotactic_app;
GRANT INSERT ("department_id", "name_ar", "name_en", "is_general", "display_order") ON TABLE public."team_committees" TO robotactic_app;
GRANT UPDATE ("name_ar", "name_en", "is_general", "display_order", "updated_at") ON TABLE public."team_committees" TO robotactic_app;
GRANT DELETE ON TABLE public."team_committees" TO robotactic_app;

GRANT SELECT ON TABLE public."team_committee_members" TO robotactic_app;
GRANT INSERT ("committee_id", "name_ar", "name_en", "role_ar", "role_en", "is_lead", "display_order") ON TABLE public."team_committee_members" TO robotactic_app;
GRANT UPDATE ("name_ar", "name_en", "role_ar", "role_en", "is_lead", "display_order", "updated_at") ON TABLE public."team_committee_members" TO robotactic_app;
GRANT DELETE ON TABLE public."team_committee_members" TO robotactic_app;

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
        {"table":"competition_supervisors","commands":["SELECT","INSERT","DELETE"],"insert":["competition_id","name_ar","name_en","title_ar","title_en","linkedin_url","display_order"]},
        {"table":"site_settings","commands":["SELECT","UPDATE"],"insert":[]},
        {"table":"about_page","commands":["SELECT","UPDATE"],"insert":[]},
        {"table":"team_departments","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["icon","name_ar","name_en","display_order"]},
        {"table":"team_department_leaders","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["department_id","role_ar","role_en","name_ar","name_en","display_order"]},
        {"table":"team_committees","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["department_id","name_ar","name_en","is_general","display_order"]},
        {"table":"team_committee_members","commands":["SELECT","INSERT","UPDATE","DELETE"],"insert":["committee_id","name_ar","name_en","role_ar","role_en","is_lead","display_order"]},
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
