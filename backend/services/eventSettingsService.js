const repository = require('../database/eventSettingsRepository');
const { hasScope } = require('../config/roleScopes');
const { httpError } = require('../utils/httpError');

function requireManager(admin) {
  if (!hasScope(admin, 'site-visibility')) throw httpError(403, 'You do not have permission to change the event start time.');
}

async function getStart(pool, admin) {
  requireManager(admin);
  const settings = await repository.getStart(pool);
  if (!settings) throw httpError(404, 'Event settings have not been configured.');
  return settings;
}

async function updateStart(pool, body, admin) {
  requireManager(admin);
  if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'event_start_at')) {
    throw httpError(400, 'Provide the event start time only.');
  }
  const value = body.event_start_at;
  if (typeof value !== 'string' || value.length !== 24 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw httpError(400, 'Choose a valid event start date and time.');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) throw httpError(400, 'Choose a valid event start date and time.');
  const updated = await repository.updateStart(pool, value);
  if (!updated) throw httpError(404, 'Event settings have not been configured.');
  return updated;
}

module.exports = { getStart, updateStart };
