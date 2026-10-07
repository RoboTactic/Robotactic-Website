const repository = require("../database/adminUserRepository");
const { hashPassword } = require("../utils/passwords");
const { httpError } = require("../utils/httpError");
const { CONTENT_SCOPES, ROLE_DEFAULTS } = require("../config/roleScopes");

const ROLES = Object.keys(ROLE_DEFAULTS);

function validateText(value, field, max = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw httpError(400, `${field} is required and must be under ${max} characters.`);
  return value.trim();
}

function validateEmail(value) {
  if (value == null || value === "") return null;
  const email = validateText(value, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, "Enter a valid email address.");
  return email;
}

function validateLoginName(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]{3,40}$/.test(value)) throw httpError(400, "Login name must be 3-40 letters, numbers, dots, underscores, or hyphens.");
  return value;
}

function validatePermissions(value, role) {
  if (!Array.isArray(value) || value.some((scope) => typeof scope !== "string" || !CONTENT_SCOPES.includes(scope)) || new Set(value).size !== value.length) {
    throw httpError(400, "Choose valid, unique section permissions.");
  }
  if (role === "super_admin" && value.length) throw httpError(400, "Super Admin already has access to every section.");
  return value;
}

function validateRole(value) {
  if (!ROLES.includes(value)) throw httpError(400, "Choose a supported role.");
  return value;
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 1024) throw httpError(400, "Password must be between 12 and 1024 characters.");
  return value;
}

function validateObject(body, allowed) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw httpError(400, "A JSON object is required.");
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw httpError(400, "Unsupported user fields.");
}

async function list(pool) {
  return repository.list(pool);
}

async function get(pool, id) {
  return repository.get(pool, id);
}

async function create(pool, body) {
  validateObject(body, ["full_name", "login_name", "email", "phone", "role_code", "permissions", "password"]);
  const role = validateRole(body.role_code);
  return repository.create(pool, {
    full_name: validateText(body.full_name, "full_name"),
    login_name: validateLoginName(body.login_name),
    email: validateEmail(body.email),
    phone: body.phone == null ? null : validateText(body.phone, "phone", 30),
    role_code: role,
    permissions: validatePermissions(body.permissions ?? (role === "super_admin" ? [] : ROLE_DEFAULTS[role]), role),
    password_hash: await hashPassword(validatePassword(body.password)),
  });
}

async function update(pool, actorId, id, body) {
  validateObject(body, ["full_name", "login_name", "email", "phone", "role_code", "permissions", "is_active", "password"]);
  if (!Object.keys(body).length) throw httpError(400, "Provide supported user fields to update.");
  const values = {};
  if (body.full_name !== undefined) values.full_name = validateText(body.full_name, "full_name");
  if (body.login_name !== undefined) values.login_name = validateLoginName(body.login_name);
  if (body.email !== undefined) values.email = validateEmail(body.email);
  if (body.phone !== undefined) values.phone = body.phone === null ? null : validateText(body.phone, "phone", 30);
  if (body.role_code !== undefined) values.role_code = validateRole(body.role_code);
  if (body.permissions !== undefined) values.permissions = validatePermissions(body.permissions, body.role_code);
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") throw httpError(400, "is_active must be true or false.");
    values.is_active = body.is_active;
  }
  if (body.password !== undefined) values.password_hash = await hashPassword(validatePassword(body.password));
  return repository.update(pool, actorId, id, values);
}

async function remove(pool, actorId, id) {
  return repository.remove(pool, actorId, id);
}

module.exports = { list, get, create, update, remove };
