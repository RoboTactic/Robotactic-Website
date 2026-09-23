

CREATE TABLE admin_credentials (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    role_code VARCHAR(50) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT admin_credentials_role_check
        CHECK (
            role_code IN (
                'super_admin',
                'competition_manager',
                'workshop_manager'
            )
        )
);



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

    link_url TEXT,

    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    requirements_ar TEXT,
    requirements_en TEXT,

    audience_type VARCHAR(50),

    team_size_min INTEGER,
    team_size_max INTEGER,

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



CREATE TABLE workshops (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,

    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,

    presenter_name TEXT NOT NULL,

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