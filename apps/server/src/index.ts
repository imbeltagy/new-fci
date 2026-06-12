import "dotenv/config";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { connectPostgres } from "./db/postgres";
import { connectRedis } from "./db/redis";
import { healthcheckRouter } from "./healthcheck/healthcheck.controller";
import swaggerDocument from "./swagger/swagger-output.json";

const PORT = Number(process.env.PORT) || 4000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/healthcheck", healthcheckRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const start = async () => {
  await connectPostgres();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
