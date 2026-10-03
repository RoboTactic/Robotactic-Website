const { COOKIE_NAME, TOKEN_TTL_SECONDS, createToken, cookieOptions } = require("../middleware/authenticate");
const { authenticateCredentials } = require("../services/authService");

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_CLIENTS = 10000;

function consumeAttempt(key) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.expiresAt <= now) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      for (const [clientKey, attempt] of attempts) {
        if (attempt.expiresAt <= now) attempts.delete(clientKey);
      }
      if (attempts.size >= MAX_TRACKED_CLIENTS) return false;
    }
    attempts.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_ATTEMPTS;
}

function createAuthController({ pool, tokenSecret, isProduction }) {
  return {
    login: async (request, response) => {
      const ipKey = request.ip || "unknown";
      if (!consumeAttempt(ipKey)) {
        console.warn("Admin sign-in was rate limited.");
        throw httpError(429, "Too many sign-in attempts. Try again later.");
      }
      const { email, password } = request.body || {};
      let admin;
      try {
        admin = await authenticateCredentials(pool, email, password);
      } catch (error) {
        if (error.statusCode === 401) {
          console.warn("Admin sign-in was rejected.");
        }
        throw error;
      }
      attempts.delete(ipKey);
      console.info("Admin sign-in succeeded.");
      const token = createToken(admin, tokenSecret);
      response.cookie(COOKIE_NAME, token, cookieOptions(isProduction));
      response.json({ data: { id: admin.id, full_name: admin.full_name, email: admin.email, role_code: admin.role_code }, expires_in: TOKEN_TTL_SECONDS });
    },
    logout: async (_request, response) => {
      response.clearCookie(COOKIE_NAME, cookieOptions(isProduction));
      response.status(204).end();
    },
    session: async (request, response) => response.json({ data: request.admin }),
  };
}

module.exports = { createAuthController };
