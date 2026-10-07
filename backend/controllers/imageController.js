const { uploadImage } = require("../services/imageStorageService");

function createImageController() {
  return {
    upload: async (request, response) => {
      const result = await uploadImage(request.params.resource, request.body, request.headers["content-type"]);
      response.status(201).json({ data: result });
    },
  };
}

module.exports = { createImageController };
