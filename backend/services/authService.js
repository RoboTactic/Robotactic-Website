const repository = require("../database/authRepository");
const { verifyPassword } = require("../utils/passwords");
const { httpError } = require("../utils/httpError");

async function authenticateCredentials(pool, loginName, password) {
  if (typeof loginName !== "string" || !/^[a-zA-Z0-9._-]{3,40}$/.test(loginName) || typeof password !== "string" || password.length > 1024) {
    throw httpError(400, "Choose an account and enter its password.");
  }
  const admin = await repository.findActiveByLoginName(pool, loginName);
  const passwordMatches = await verifyPassword(password, admin?.password_hash);
  if (!admin || !passwordMatches) throw httpError(401, "Account or password is incorrect.");
  return admin;
}

module.exports = { authenticateCredentials };
