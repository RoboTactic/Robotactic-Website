const service = require("../services/speakerService");

function createSpeakerController(pool) {
  return {
    list: async (request, response) => response.json({ data: await service.list(pool, request.query.parent) }),
    get: async (request, response) => response.json({ data: await service.get(pool, request.params.id) }),
    create: async (request, response) => response.status(201).json({ data: await service.create(pool, request.body) }),
    update: async (request, response) => response.json({ data: await service.update(pool, request.params.id, request.body) }),
    remove: async (request, response) => { await service.remove(pool, request.params.id); response.status(204).end(); },
    addWorkshop: async (request, response) => response.status(201).json({ data: await service.addWorkshop(pool, request.params.id, request.body) }),
    updateWorkshop: async (request, response) => response.json({ data: await service.updateWorkshop(pool, request.params.id, request.params.workshopId, request.body) }),
    removeWorkshop: async (request, response) => response.json({ data: await service.removeWorkshop(pool, request.params.id, request.params.workshopId) }),
  };
}

module.exports = { createSpeakerController };
