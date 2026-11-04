const { publicContentCache } = require('../services/publicContentCache');

function invalidatePublicContent(pool) {
  return (request, response, next) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      response.once('finish', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) publicContentCache(pool).clear();
      });
    }
    next();
  };
}

module.exports = { invalidatePublicContent };
