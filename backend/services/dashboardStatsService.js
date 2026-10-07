const { hasScope } = require("../config/roleScopes");
const { httpError } = require("../utils/httpError");
const repository = require("../database/dashboardStatsRepository");

async function getCounts(pool, admin) {
  if (!hasScope(admin, "dashboard")) throw httpError(403, "You do not have permission to view dashboard statistics.");
  const resources = Object.keys(repository.TABLES).filter((resource) => hasScope(admin, resource));
  return repository.counts(pool, resources);
}

module.exports = { getCounts };
