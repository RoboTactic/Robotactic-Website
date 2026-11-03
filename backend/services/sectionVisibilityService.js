const repository = require('../database/sectionVisibilityRepository');
const { PUBLIC_SECTIONS } = require('../config/publicSections');
const { hasScope } = require('../config/roleScopes');
const { httpError } = require('../utils/httpError');

async function get(pool) {
  const rows = await repository.list(pool);
  // Missing configuration never exposes an unpublished section.
  return Object.fromEntries(Object.keys(PUBLIC_SECTIONS).map(key => [key, rows.some(row => row.section_key === key && row.is_visible === true)]));
}

async function update(pool, section, body, admin) {
  if (!Object.hasOwn(PUBLIC_SECTIONS, section)) throw httpError(404, 'Section not found.');
  if (!hasScope(admin, PUBLIC_SECTIONS[section])) throw httpError(403, 'You do not have permission to change this section.');
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'visible') || typeof body.visible !== 'boolean') {
    throw httpError(400, 'Provide a visible boolean only.');
  }
  const row = await repository.update(pool, section, body.visible);
  return { section: row.section_key, visible: row.is_visible };
}

async function requireVisible(pool, section) {
  if (!Object.hasOwn(PUBLIC_SECTIONS, section) || !await repository.isVisible(pool, section)) throw httpError(404, 'Content not found.');
}

module.exports = { get, update, requireVisible };
