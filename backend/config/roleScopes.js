const CONTENT_SCOPES = Object.freeze(["competitions", "teams", "workshops", "speakers", "projects", "announcements"]);
const ROLE_DEFAULTS = Object.freeze({
  super_admin: CONTENT_SCOPES,
  competition_manager: ["competitions", "teams"],
  workshop_manager: ["workshops", "speakers"],
  team_member: [],
});

function hasScope(admin, scope) {
  if (!admin) return false;
  if (["about", "team-members"].includes(scope)) return admin.role_code === "super_admin";
  if (scope === "dashboard") return true;
  if (scope === "users") return admin.role_code === "super_admin";
  if (!CONTENT_SCOPES.includes(scope)) return false;
  return admin.role_code === "super_admin" || admin.permissions?.includes(scope) === true;
}

module.exports = { CONTENT_SCOPES, ROLE_DEFAULTS, hasScope };
