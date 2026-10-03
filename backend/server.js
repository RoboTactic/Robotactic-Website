const cors = require("cors");
const express = require("express");

const { authTokenSecret, corsOrigins, nodeEnv, port } = require("./config/env");
const { connectDatabase, pool } = require("./database/pool");
const { createApiRoutes } = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (nodeEnv === "production") response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    callback(null, !origin || corsOrigins.includes(origin));
  },
}));
app.use(express.json({ limit: "100kb" }));

app.use((request, _response, next) => {
  const cookies = request.headers.cookie || "";
  request.cookies = Object.fromEntries(cookies.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return ["", ""];
    const key = part.slice(0, separator).trim();
    try { return [key, decodeURIComponent(part.slice(separator + 1).trim())]; }
    catch { return [key, ""]; }
  }).filter(([key]) => key));
  next();
});

app.use("/api", createApiRoutes({
  pool,
  authTokenSecret,
  corsOrigins,
  isProduction: nodeEnv === "production",
}));

app.use(notFound);
app.use(errorHandler);

let server;
let isClosing = false;

async function start() {
  try {
    await connectDatabase();
    server = app.listen(port, () => {
      console.log(`RoboTactic API is running on port ${port}`);
    });
  } catch (error) {
    console.error(
      "Unable to start the API because the PostgreSQL connection failed.",
      error.code || "database_configuration_error",
    );
    await pool.end().catch(() => {});
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (isClosing) return;
  isClosing = true;
  console.log(`Received ${signal}; closing the API.`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await pool.end();
  } catch (error) {
    console.error("Error while closing the API.", error.code || "shutdown_error");
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

start();
