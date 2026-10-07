const { httpError } = require("../utils/httpError");
const { hasScope } = require("../config/roleScopes");

function authorize(scope) {
  return function requireRole(request, _response, next) {
    if (!hasScope(request.admin, scope)) {
      return next(httpError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}

module.exports = { authorize };
