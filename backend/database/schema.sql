

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

INSERT INTO about_page (id,title_ar,title_en,subtitle_ar,subtitle_en,body_ar,body_en,values_ar,values_en,status) VALUES (1,'عن الملتقى','About RoboTactic','تجربة متكاملة تجمع بين التنافس والتعلّم واستعراض الابتكارات في بيئة تفاعلية ملهمة.','A robotics event bringing competition, learning and innovation together.','يرتكز الملتقى على مسابقات الروبوتات التي تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، بهدف تنمية مهارات التصميم والبرمجة وحل المشكلات والعمل الجماعي والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية. ويصاحب الملتقى معرض للمشاريع والابتكارات ذات العلاقة بالقطاعات الدفاعية في المملكة.','RoboTactic brings together robotics competitions for secondary-school and university students, developing design, programming, problem-solving, teamwork and strategic thinking. The event also features a showcase of projects and innovations related to defense sectors in Saudi Arabia.','["الابتكار والإبداع", "التفكير الاستراتيجي", "التميّز والجودة", "الاحترافية", "التعاون والعمل الجماعي"]'::jsonb,'["Innovation and creativity","Strategic thinking","Excellence and quality","Professionalism","Collaboration and teamwork"]'::jsonb,'published') ON CONFLICT (id) DO NOTHING;
