const service = require('../services/sectionVisibilityService');

function requirePublicSection(pool, section) {
  return async (_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    await service.requireVisible(pool, section);
    next();
  };
}

module.exports = { requirePublicSection };
