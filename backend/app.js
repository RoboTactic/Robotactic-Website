const cors = require("cors");
const express = require("express");
const { createApiRoutes } = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Shared by the Node server and the Workers HTTP adapter; no startup I/O here.
function createApp({ pool, getPool, getClientIp, authTokenSecret, corsOrigins, nodeEnv, supabaseUrl, supabaseSecretKey }) {
  const app = express();
  app.disable("x-powered-by");
  if (getClientIp) app.use((request, _response, next) => {
    Object.defineProperty(request, "ip", { value: getClientIp() });
    next();
  });
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    if (nodeEnv === "production") response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  app.use(cors({
    credentials: true,
    origin(origin, callback) { callback(null, !origin || corsOrigins.includes(origin)); },
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use((request, _response, next) => {
    request.cookies = Object.fromEntries((request.headers.cookie || "").split(";").map((part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return ["", ""];
      const key = part.slice(0, separator).trim();
      try { return [key, decodeURIComponent(part.slice(separator + 1).trim())]; }
      catch { return [key, ""]; }
    }).filter(([key]) => key));
    next();
  });
  const options = { pool, authTokenSecret, corsOrigins, isProduction: nodeEnv === "production",
    storage: { supabaseUrl, supabaseSecretKey } };
  // Workers pools belong to one request. Never share their sockets or pending queries.
  app.use("/api", getPool
    ? (request, response, next) => createApiRoutes({ ...options, pool: getPool() })(request, response, next)
    : createApiRoutes(options));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
