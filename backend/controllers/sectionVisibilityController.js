const service = require('../services/sectionVisibilityService');

function createSectionVisibilityController(pool) {
  return {
    get: async (_request, response) => {
      response.set('Cache-Control', 'no-store');
      response.json({ data: await service.get(pool) });
    },
    update: async (request, response) => {
      response.set('Cache-Control', 'no-store');
      response.json({ data: await service.update(pool, request.params.section, request.body, request.admin) });
    },
  };
}

module.exports = { createSectionVisibilityController };
