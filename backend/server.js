const config = require("./config/env");
const { port } = config;
const { connectDatabase, pool } = require("./database/pool");
const { createApp } = require("./app");
const app = createApp({ ...config, pool });

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
