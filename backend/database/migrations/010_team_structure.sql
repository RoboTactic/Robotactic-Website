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
