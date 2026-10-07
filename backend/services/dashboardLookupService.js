const repository = require("../database/dashboardLookupRepository");

module.exports = {
  workshops: (pool) => repository.workshops(pool),
  competitions: (pool) => repository.competitions(pool),
};
