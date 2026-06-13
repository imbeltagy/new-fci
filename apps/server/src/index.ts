import "reflect-metadata";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { Role } from "@prisma/client";

import { accessGroupsRouter } from "./access-groups/access-groups.router";
import { assignmentsRouter } from "./assignments/assignments.router";
import { authRouter } from "./auth/auth.router";
import { permissionsConfig } from "./config/permissions.config";
import { connectPostgres } from "./db/postgres";
import { connectRedis } from "./db/redis";
import { healthcheckRouter } from "./healthcheck/healthcheck.router";
import { joinYearsRouter } from "./join-years/join-years.router";
import { majorsRouter } from "./majors/majors.router";
import { auth } from "./middleware/auth";
import { subjectsRouter } from "./subjects/subjects.router";
import swaggerDocument from "./swagger/swagger-output.json";
import { usersRouter } from "./users/users.router";

const PORT = Number(process.env.PORT) || 4000;

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL ?? "http://localhost:3000",
      process.env.ADMIN_URL ?? "http://localhost:3001",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/healthcheck", healthcheckRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/users/:userId/assignments", assignmentsRouter);
app.use("/access-groups", accessGroupsRouter);
app.use("/join-years", joinYearsRouter);
app.use("/majors", majorsRouter);
app.use("/subjects", subjectsRouter);

app.get(
  "/permissions-config",
  auth({ authorization: "session", roles: [Role.superadmin] }),
  (_req, res) => {
    // #swagger.tags = ['Config']
    res.json(permissionsConfig);
  },
);

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
