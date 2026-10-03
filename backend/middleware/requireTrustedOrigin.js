const { httpError } = require("../utils/httpError");

function requireTrustedOrigin(allowedOrigins) {
  return function verifyOrigin(request, _response, next) {
    const origin = request.get("origin");
    if (!origin || !allowedOrigins.includes(origin)) return next(httpError(403, "Request origin is not allowed."));
    next();
  };
}

module.exports = { requireTrustedOrigin };
