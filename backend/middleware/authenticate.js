const { createHmac, timingSafeEqual } = require("node:crypto");
const { httpError } = require("../utils/httpError");
const adminUsers = require("../database/authRepository");

const COOKIE_NAME = "robotactic_admin";
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createToken(user, secret) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.role_code,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function decodeToken(token, secret) {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isInteger(value.sub) || !Number.isInteger(value.exp) || value.exp <= Date.now() / 1000) return null;
    return value;
  } catch {
    return null;
  }
}

function cookieOptions(isProduction) {
  return { httpOnly: true, secure: isProduction, sameSite: "strict", path: "/api", maxAge: TOKEN_TTL_SECONDS * 1000 };
}

function authenticate({ pool, tokenSecret, isProduction }) {
  return async function requireAuthentication(request, _response, next) {
    const token = request.cookies?.[COOKIE_NAME];
    const claims = decodeToken(token, tokenSecret);
    if (!claims) return next(httpError(401, "Authentication required."));

    try {
      const admin = await adminUsers.findActiveById(pool, claims.sub);
      if (!admin) return next(httpError(401, "Authentication required."));
      request.admin = admin;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { COOKIE_NAME, TOKEN_TTL_SECONDS, authenticate, createToken, cookieOptions };
