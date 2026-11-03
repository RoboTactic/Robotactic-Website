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
