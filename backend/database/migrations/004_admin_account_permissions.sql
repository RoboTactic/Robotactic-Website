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
