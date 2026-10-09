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
