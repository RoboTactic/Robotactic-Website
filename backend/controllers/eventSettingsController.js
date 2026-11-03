const service = require('../services/eventSettingsService');

function createEventSettingsController(pool) {
  return {
    getStart: async (request, response) => response.json({ data: await service.getStart(pool, request.admin) }),
    updateStart: async (request, response) => response.json({ data: await service.updateStart(pool, request.body, request.admin) }),
  };
}

module.exports = { createEventSettingsController };
