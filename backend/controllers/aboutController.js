const service = require('../services/aboutService');
function createAboutController(pool) {
  return {
    publicGet: async (_req,res)=>res.json({data:await service.publicGet(pool)}),
    get: async (_req,res)=>res.json({data:await service.get(pool)}),
    update: async (req,res)=>res.json({data:await service.update(pool,req.body)}),
  };
}
module.exports = {createAboutController};
