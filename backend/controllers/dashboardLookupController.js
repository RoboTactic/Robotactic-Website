const service = require("../services/dashboardLookupService");

function createDashboardLookupController(pool) {
  return {
    workshops: async (_request, response) => response.json({ data: await service.workshops(pool) }),
    competitions: async (_request, response) => response.json({ data: await service.competitions(pool) }),
  };
}

module.exports = { createDashboardLookupController };
