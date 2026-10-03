const service = require("../services/adminUserService");

function createAdminUserController(pool) {
  return {
    list: async (_request, response) => response.json({ data: await service.list(pool) }),
    create: async (request, response) => response.status(201).json({ data: await service.create(pool, request.body) }),
    update: async (request, response) => response.json({ data: await service.update(pool, request.admin.id, request.params.id, request.body) }),
    remove: async (request, response) => {
      await service.remove(pool, request.admin.id, request.params.id);
      response.status(204).end();
    },
  };
}

module.exports = { createAdminUserController };
