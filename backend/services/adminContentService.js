const { httpError } = require("../utils/httpError");
const repository = require("../database/adminContentRepository");

const shared = {
  status: { type: "enum", values: ["draft", "published", "hidden"] },
  is_featured: { type: "boolean" },
  featured_order: { type: "positiveInteger", nullable: true },
};

const resources = {
  "team-members": {
    table: "event_team_members",
    fields: {
      name_ar: { type: "string" }, name_en: { type: "string" },
      role_ar: { type: "string" }, role_en: { type: "string" },
      bio_ar: { type: "string", nullable: true }, bio_en: { type: "string", nullable: true },
      image_url: { type: "url", nullable: true }, public_email: { type: "email", nullable: true },
      contact_url: { type: "url", nullable: true }, linkedin_url: { type: "url", nullable: true }, x_url: { type: "url", nullable: true },
      display_order: { type: "positiveInteger" }, status: { type: "enum", values: ["draft", "published", "hidden"] },
    },
    required: ["name_ar", "name_en", "role_ar", "role_en", "display_order", "status"],
    order: "display_order ASC, id ASC",
  },

  competitions: {
    table: "competitions",
    fields: {
      name_ar: { type: "string", required: true }, name_en: { type: "string", required: true },
      description_ar: { type: "string", required: true }, description_en: { type: "string", required: true },
      category_code: { type: "enum", values: ["combat", "simulation", "sensing", "other"] },
      requirements_ar: { type: "string", nullable: true }, requirements_en: { type: "string", nullable: true },
      audience_type: { type: "string", nullable: true }, team_size_min: { type: "positiveInteger", nullable: true },
      team_size_max: { type: "positiveInteger", nullable: true }, max_teams: { type: "positiveInteger", nullable: true },
      start_at: { type: "date", nullable: true }, end_at: { type: "date", nullable: true },
      registration_status: { type: "enum", values: ["open", "closed", "coming_soon"] },
      registration_url: { type: "url", nullable: true }, image_url: { type: "url", nullable: true },
      ...shared,
    },
    required: ["name_ar", "name_en", "description_ar", "description_en"],
    order: "featured_order ASC NULLS LAST, id ASC",
  },
  workshops: {
    table: "workshops",
    fields: {
      title_ar: { type: "string", required: true }, title_en: { type: "string", required: true },
      description_ar: { type: "string", required: true }, description_en: { type: "string", required: true },
      image_url: { type: "url", nullable: true },
      start_at: { type: "date", required: true }, end_at: { type: "date", nullable: true },
      capacity: { type: "integer", nullable: true }, available_seats: { type: "integer", nullable: true },
      registration_status: { type: "enum", values: ["open", "closed", "coming_soon"] },
      registration_url: { type: "url", nullable: true }, meeting_url: { type: "url", nullable: true },
      ...shared,
    },
    required: ["title_ar", "title_en", "description_ar", "description_en", "start_at"],
    order: "start_at ASC, id ASC",
  },
  projects: {
    table: "projects",
    fields: {
      name_ar: { type: "string", required: true }, name_en: { type: "string", required: true },
      description_ar: { type: "string", required: true }, description_en: { type: "string", required: true },
      project_type: { type: "enum", values: ["defense", "invention"] },
      category_id: { type: "positiveInteger", nullable: true }, image_url: { type: "url", nullable: true },
      team_name: { type: "string", required: true }, team_leader_name: { type: "string", nullable: true },
      project_url: { type: "url", nullable: true }, video_url: { type: "url", nullable: true },
      technologies: { type: "string", nullable: true }, stage_ar: { type: "string", nullable: true },
      stage_en: { type: "string", nullable: true }, ...shared,
    },
    required: ["name_ar", "name_en", "description_ar", "description_en", "project_type", "team_name"],
    order: "is_featured DESC, featured_order ASC NULLS LAST, id DESC",
  },
  announcements: {
    table: "announcements",
    fields: {
      title_ar: { type: "string", required: true }, title_en: { type: "string", required: true },
      description_ar: { type: "string", nullable: true }, description_en: { type: "string", nullable: true },
      image_url: { type: "url", nullable: true }, link_url: { type: "url", nullable: true },
      start_at: { type: "date", nullable: true }, end_at: { type: "date", nullable: true },
      status: { type: "enum", values: ["draft", "published", "in_review", "expired"] },
    },
    required: ["title_ar", "title_en"], order: "start_at DESC NULLS LAST, id DESC",
  },
  teams: {
    table: "competition_teams",
    fields: {
      competition_id: { type: "positiveInteger", required: true }, team_name: { type: "string", required: true },
      team_leader_name: { type: "string", required: true }, leader_email: { type: "email", required: true },
      leader_phone: { type: "string", required: true }, member_names: { type: "string", required: true },
    },
    required: ["competition_id", "team_name", "team_leader_name", "leader_email", "leader_phone", "member_names"],
    order: "registered_at DESC, id DESC",
  },
};

const validators = {
  string(value, field) {
    if (typeof value !== "string" || !value.trim() || value.length > 4000) throw httpError(400, `${field} must be a non-empty string up to 4000 characters.`);
    return value.trim();
  },
  email(value, field) {
    const email = validators.string(value, field);
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, `${field} must be a valid email address.`);
    return email.toLowerCase();
  },
  url(value, field) {
    if (value === null) return null;
    const url = validators.string(value, field);
    try {
      if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error();
    } catch { throw httpError(400, `${field} must be an HTTP or HTTPS URL.`); }
    return url;
  },
  date(value, field) {
    if (value === null) return null;
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw httpError(400, `${field} must be a valid ISO date or timestamp.`);
    return new Date(value).toISOString();
  },
  integer(value, field) {
    if (!Number.isInteger(value) || value < 0) throw httpError(400, `${field} must be a non-negative integer.`);
    return value;
  },
  positiveInteger(value, field) {
    if (value === null) return null;
    if (!Number.isInteger(value) || value <= 0) throw httpError(400, `${field} must be a positive integer.`);
    return value;
  },
  boolean(value, field) {
    if (typeof value !== "boolean") throw httpError(400, `${field} must be true or false.`);
    return value;
  },
  enum(value, field, descriptor) {
    if (!descriptor.values.includes(value)) throw httpError(400, `${field} has an unsupported value.`);
    return value;
  },
};

function validate(resource, body, partial = false) {
  const definition = resources[resource];
  if (!body || typeof body !== "object" || Array.isArray(body)) throw httpError(400, "A JSON object is required.");
  if (resource === "team-members" && Object.keys(body).some(key=>!Object.hasOwn(definition.fields,key))) throw httpError(400,"Unsupported content field.");
  if (resource === "team-members" && body.display_order !== undefined && (!Number.isSafeInteger(body.display_order) || body.display_order < 1 || body.display_order > 2147483647)) throw httpError(400,"Choose a positive display order up to 2147483647.");
  const unknown = Object.keys(body).filter((key) => !definition.fields[key] && !(resource === "projects" && key === "members"));
  if (unknown.length) throw httpError(400, `Unsupported fields: ${unknown.join(", ")}.`);
  const normalized = {};
  for (const [key, value] of Object.entries(body)) {
    if (resource === "projects" && key === "members") {
      if (!Array.isArray(value) || value.length > 50) throw httpError(400, "members must be an array of up to 50 project members.");
      normalized.members = value.map((member, index) => {
        if (!member || typeof member !== "object" || Array.isArray(member)) throw httpError(400, `members[${index}] must be an object.`);
        const memberKeys = Object.keys(member);
        if (memberKeys.some((item) => !["name", "linkedin_url", "x_url", "display_order"].includes(item))) throw httpError(400, `members[${index}] contains an unsupported field.`);
        const name = validators.string(member.name, `members[${index}].name`);
        const linkedin_url = member.linkedin_url == null || member.linkedin_url === "" ? null : validators.url(member.linkedin_url, `members[${index}].linkedin_url`);
        const x_url = member.x_url == null || member.x_url === "" ? null : validators.url(member.x_url, `members[${index}].x_url`);
        const display_order = member.display_order == null ? index + 1 : validators.positiveInteger(member.display_order, `members[${index}].display_order`);
        return { name, linkedin_url, x_url, display_order };
      });
      continue;
    }
    const descriptor = definition.fields[key];
    if (resource === "team-members" && value === null && !descriptor.nullable) throw httpError(400, `${key} cannot be null.`);
    if (value === null && descriptor.nullable) normalized[key] = null;
    else normalized[key] = validators[descriptor.type](value, key, descriptor);
  }
  if (!partial) {
    const missing = definition.required.filter((key) => normalized[key] === undefined);
    if (missing.length) throw httpError(400, `Missing required fields: ${missing.join(", ")}.`);
  }
  if (!Object.keys(normalized).length) throw httpError(400, "At least one supported field is required.");
  const startAt = normalized.start_at;
  const endAt = normalized.end_at;
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) throw httpError(400, "end_at must be later than start_at.");
  const minSize = normalized.team_size_min;
  const maxSize = normalized.team_size_max;
  if (minSize != null && maxSize != null && maxSize < minSize) throw httpError(400, "team_size_max must be greater than or equal to team_size_min.");
  const capacity = normalized.capacity;
  const availableSeats = normalized.available_seats;
  if (capacity != null && availableSeats != null && availableSeats > capacity) throw httpError(400, "available_seats cannot exceed capacity.");
  return normalized;
}

async function list(pool, resource, filter) {
  return repository.list(pool, resource, resources[resource], filter);
}

async function get(pool, resource, id) {
  return repository.get(pool, resource, resources[resource], id);
}

async function create(pool, resource, body) {
  return repository.create(pool, resource, resources[resource], validate(resource, body));
}

async function update(pool, resource, id, body) {
  return repository.update(pool, resource, resources[resource], id, validate(resource, body, true));
}

async function remove(pool, resource, id) {
  return repository.remove(pool, resource, resources[resource], id);
}

module.exports = { resources, list, get, create, update, remove };
