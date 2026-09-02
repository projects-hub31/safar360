const env = require("./src/config/env");
const connectDB = require("./src/config/db");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const apiRoutes = require("./src/routes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");
const { ok } = require("./src/utils/respond");

const app = express();

// origin:true reflects the request's own Origin (required alongside
// credentials:true — the client sends cookies for refresh-token rotation).
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  ok(res, { message: "Safar360 API is running" });
});

app.get("/api/health", (req, res) => {
  ok(res, { status: "up" });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
});
