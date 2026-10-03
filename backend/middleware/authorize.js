const { httpError } = require("../utils/httpError");

const ROLE_SCOPES = {
  super_admin: new Set(["competitions", "teams", "workshops", "participants", "projects", "announcements", "users"]),
  competition_manager: new Set(["competitions", "teams"]),
  workshop_manager: new Set(["workshops", "participants"]),
};

function authorize(scope) {
  return function requireRole(request, _response, next) {
    if (!request.admin || !ROLE_SCOPES[request.admin.role_code]?.has(scope)) {
      return next(httpError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}

module.exports = { authorize, ROLE_SCOPES };
