// Reviewed backend SQL needs. Used by the role audit and disposable DB tests.
// Changes here do not grant permissions; runtimePermissions.sql needs review too.
const { resources } = require("../services/adminContentService");
const { fields: aboutFields } = require("../database/aboutRepository");

const tables = Object.fromEntries(Object.values(resources).map(({ table, fields }) => [table, {
  insert: Object.keys(fields), update: [...Object.keys(fields), "updated_at"], delete: true,
}]));
Object.assign(tables, {
  admin_users: {
    insert: ["full_name", "login_name", "email", "phone", "role_code", "password_hash"],
    update: ["full_name", "login_name", "email", "phone", "role_code", "password_hash", "is_active", "updated_at"], delete: true,
  },
  admin_user_permissions: { insert: ["user_id", "scope"], update: [], delete: true },
  speakers: { insert: ["full_name", "phone", "notes"], update: ["full_name", "phone", "notes", "updated_at"], delete: true },
  workshop_speakers: { insert: ["workshop_id", "speaker_id", "is_public"], update: ["is_public", "updated_at"], delete: true },
  project_members: { insert: ["project_id", "name", "linkedin_url", "x_url", "display_order"], update: [], delete: true },
  site_settings: { insert: [], update: ["event_start_at", "updated_at"], delete: false },
  about_page: { insert: [], update: [...aboutFields, "updated_at"], delete: false },
  public_section_visibility: { insert: ["section_key", "is_visible"], update: ["is_visible", "updated_at"], delete: false },
  project_categories: { insert: [], update: [], delete: false },
  timeline_events: { insert: [], update: [], delete: false },
  sponsors: { insert: [], update: [], delete: false },
  faqs: { insert: [], update: [], delete: false },
});

module.exports = { roleName: "robotactic_app", tables };
