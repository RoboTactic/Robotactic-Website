const cors = require("cors");
const express = require("express");

const { port } = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`RoboTactic API is running on port ${port}`);
});
