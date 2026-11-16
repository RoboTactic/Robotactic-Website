function notFound(request, response) {
  response.status(404).json({ message: "Route not found." });
}

// Log only non-sensitive identifiers (SQLSTATE / network code), never messages or connection details.
function logServerError(error, request) {
  const safe = (value) => (typeof value === "string" && /^[A-Za-z0-9_]{1,40}$/.test(value) ? value : undefined);
  console.error(JSON.stringify({
    event: "api_unhandled_error",
    method: request.method,
    route: `${request.baseUrl || ""}${request.route?.path || ""}` || undefined,
    code: safe(error?.code),
    name: safe(error?.name),
    // Connection/resource/system classes carry server-generated text, never row data.
    ...(/^(08|53|57|58)/.test(String(error?.code || "")) ? {
      detail: String(error.message || "").replace(/\S*:\/\/\S*/g, "[url]").slice(0, 160),
    } : {}),
  }));
}

function errorHandler(error, request, response, _next) {
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
  if (statusCode >= 500) logServerError(error, request);

  response.status(statusCode).json({
    message: mapped?.[1] || (statusCode >= 500 ? "Internal server error" : error.message),
  });
}

module.exports = { notFound, errorHandler };
