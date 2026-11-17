const service = require('../services/teamStructureService');

function createTeamStructureController(pool) {
  return {
    publicGet: async (_request, response) => response.json({ data: await service.publicTree(pool) }),
    get: async (_request, response) => response.json({ data: await service.getTree(pool) }),
    createDepartment: async (request, response) => response.status(201).json({ data: await service.create(pool, 'departments', null, request.body) }),
    createChild: (kind) => async (request, response) => response.status(201).json({ data: await service.create(pool, kind, request.params.parentId, request.body) }),
    update: async (request, response) => response.json({ data: await service.update(pool, request.params.kind, request.params.id, request.body) }),
    remove: async (request, response) => response.json({ data: await service.remove(pool, request.params.kind, request.params.id) }),
    move: async (request, response) => response.json({ data: await service.move(pool, request.params.kind, request.params.id, request.body) }),
  };
}

module.exports = { createTeamStructureController };
