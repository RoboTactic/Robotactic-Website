const service = require("../services/dashboardStatsService");

function createDashboardStatsController(pool) {
  return {
    get: async (request, response) => {
      response.json({ data: await service.getCounts(pool, request.admin) });
    },
  };
}

module.exports = { createDashboardStatsController };
