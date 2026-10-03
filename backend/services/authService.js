const repository = require("../database/authRepository");
const { verifyPassword } = require("../utils/passwords");
const { httpError } = require("../utils/httpError");

async function authenticateCredentials(pool, email, password) {
  if (typeof email !== "string" || typeof password !== "string" || password.length > 1024) {
    throw httpError(400, "Enter a valid email and password.");
  }
  const admin = await repository.findActiveByEmail(pool, email.trim().slice(0, 255));
  const passwordMatches = await verifyPassword(password, admin?.password_hash);
  if (!admin || !passwordMatches) throw httpError(401, "Email or password is incorrect.");
  return admin;
}

module.exports = { authenticateCredentials };
