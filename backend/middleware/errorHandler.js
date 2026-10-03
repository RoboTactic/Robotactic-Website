function notFound(request, response) {
  response.status(404).json({ message: "Route not found." });
}

function errorHandler(error, _request, response, _next) {
  const databaseErrors = {
    "23505": [409, "A record with these details already exists."],
    "23503": [400, "A related record does not exist."],
    "23514": [400, "One or more values do not meet the required constraints."],
    "23502": [400, "A required field is missing."],
    "22P02": [400, "One or more values have an invalid format."],
    "22001": [400, "One or more values are too long."],
    "22007": [400, "One or more dates have an invalid format."],
  };
  const mapped = databaseErrors[error.code];
  const statusCode = mapped?.[0] || error.statusCode || error.status || 500;

  response.status(statusCode).json({
    message: mapped?.[1] || (statusCode >= 500 ? "Internal server error" : error.message),
  });
}

module.exports = { notFound, errorHandler };
