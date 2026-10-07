const { httpError } = require("../utils/httpError");
const repository = require("../database/speakerRepository");

function id(value, label = "id") {
  const number = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(number) || number < 1) throw httpError(400, `A valid ${label} is required.`);
  return number;
}

function object(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw httpError(400, "A JSON object is required.");
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw httpError(400, "Unsupported field.");
}

function text(value, label, max, nullable = false) {
  if (nullable && (value === null || value === "")) return null;
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw httpError(400, `${label} must contain 1 to ${max} characters.`);
  return value.trim();
}

function person(body, partial = false) {
  object(body, ["full_name", "phone", "notes"]);
  const values = {};
  if (!partial || Object.hasOwn(body, "full_name")) values.full_name = text(body.full_name, "full_name", 255);
  if (!partial || Object.hasOwn(body, "phone")) values.phone = text(body.phone, "phone", 30);
  if (!partial || Object.hasOwn(body, "notes")) values.notes = text(body.notes, "notes", 4000, true);
  if (!Object.keys(values).length) throw httpError(400, "At least one field is required.");
  return values;
}

function assignment(body) {
  object(body, ["workshop_id", "is_public"]);
  if (!Object.hasOwn(body, "workshop_id")) throw httpError(400, "Choose a workshop.");
  if (body.is_public !== undefined && typeof body.is_public !== "boolean") throw httpError(400, "is_public must be true or false.");
  return { workshop_id: id(body.workshop_id, "workshop id"), is_public: body.is_public ?? false };
}

async function create(pool, body) {
  object(body, ["full_name", "phone", "notes", "workshop_id", "is_public"]);
  const speaker = person({ full_name: body.full_name, phone: body.phone, notes: body.notes ?? null });
  return repository.create(pool, speaker, assignment({ workshop_id: body.workshop_id, is_public: body.is_public }));
}

async function updateWorkshop(pool, speakerId, workshopId, body) {
  object(body, ["is_public"]);
  if (typeof body.is_public !== "boolean") throw httpError(400, "is_public must be true or false.");
  return repository.updateWorkshop(pool, id(speakerId), id(workshopId, "workshop id"), body.is_public);
}

module.exports = {
  list: (pool, workshopId) => repository.list(pool, workshopId == null ? null : id(workshopId, "workshop id")),
  get: (pool, speakerId) => repository.get(pool, id(speakerId)),
  create,
  update: (pool, speakerId, body) => repository.update(pool, id(speakerId), person(body, true)),
  remove: (pool, speakerId) => repository.remove(pool, id(speakerId)),
  addWorkshop: (pool, speakerId, body) => repository.addWorkshop(pool, id(speakerId), assignment(body)),
  updateWorkshop,
  removeWorkshop: (pool, speakerId, workshopId) => repository.removeWorkshop(pool, id(speakerId), id(workshopId, "workshop id")),
};
