const { httpError } = require("../utils/httpError");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_WRITES = 60;
const attempts = new Map();

function rateLimitAdminWrites(request, _response, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
  const key = String(request.admin?.id || "unknown");
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.expiresAt <= now) {
    attempts.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return next();
  }
  current.count += 1;
  if (current.count > MAX_WRITES) {
    console.warn("Admin write requests were rate limited.");
    return next(httpError(429, "Too many changes. Try again later."));
  }
  next();
}

module.exports = { rateLimitAdminWrites };
