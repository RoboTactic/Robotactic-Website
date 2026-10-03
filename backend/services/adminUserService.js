const repository = require("../database/adminUserRepository");
const { hashPassword } = require("../utils/passwords");
const { httpError } = require("../utils/httpError");

const ROLES = ["super_admin", "competition_manager", "workshop_manager"];

function validateText(value, field, max = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw httpError(400, `${field} is required and must be under ${max} characters.`);
  return value.trim();
}

function validateEmail(value) {
  const email = validateText(value, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, "Enter a valid email address.");
  return email;
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

async function create(pool, body) {
  validateObject(body, ["full_name", "email", "phone", "role_code", "password"]);
  return repository.create(pool, {
    full_name: validateText(body.full_name, "full_name"),
    email: validateEmail(body.email),
    phone: body.phone == null ? null : validateText(body.phone, "phone", 30),
    role_code: validateRole(body.role_code),
    password_hash: await hashPassword(validatePassword(body.password)),
  });
}

async function update(pool, actorId, id, body) {
  validateObject(body, ["full_name", "email", "phone", "role_code", "is_active", "password"]);
  if (!Object.keys(body).length) throw httpError(400, "Provide supported user fields to update.");
  const values = {};
  if (body.full_name !== undefined) values.full_name = validateText(body.full_name, "full_name");
  if (body.email !== undefined) values.email = validateEmail(body.email);
  if (body.phone !== undefined) values.phone = body.phone === null ? null : validateText(body.phone, "phone", 30);
  if (body.role_code !== undefined) values.role_code = validateRole(body.role_code);
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

module.exports = { list, create, update, remove };
