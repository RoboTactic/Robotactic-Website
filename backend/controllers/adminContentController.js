const service = require("../services/adminContentService");

function createAdminContentController(pool) {
  return {
    list: (resource) => async (request, response) => {
      const parent = request.query.parent;
      const filter = resource === "teams" && parent ? ["competition_id", parent]
        : resource === "participants" && parent ? ["workshop_id", parent] : null;
      response.json({ data: await service.list(pool, resource, filter) });
    },
    get: (resource) => async (request, response) => response.json({ data: await service.get(pool, resource, request.params.id) }),
    create: (resource) => async (request, response) => response.status(201).json({ data: await service.create(pool, resource, request.body) }),
    update: (resource) => async (request, response) => response.json({ data: await service.update(pool, resource, request.params.id, request.body) }),
    remove: (resource) => async (request, response) => {
      await service.remove(pool, resource, request.params.id);
      response.status(204).end();
    },
  };
}

module.exports = { createAdminContentController };
