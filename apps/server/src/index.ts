import "reflect-metadata";
import "dotenv/config";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import cron from "node-cron";
import swaggerUi from "swagger-ui-express";

import { Role } from "@prisma/client";

import { accessGroupsRouter } from "./access-groups/access-groups.router";
import { assessmentsRouter } from "./assessments/assessments.router";
import { conversationsRouter } from "./conversations/conversations.router";
import { FilesService } from "./files/files.service";
import { assignmentsRouter } from "./assignments/assignments.router";
import { authRouter } from "./auth/auth.router";
import { permissionsConfig } from "./config/permissions.config";
import { connectPostgres } from "./db/postgres";
import { connectRedis } from "./db/redis";
import { initSocket } from "./lib/socket";
import { healthcheckRouter } from "./healthcheck/healthcheck.router";
import { joinYearsRouter } from "./join-years/join-years.router";
import { majorsRouter } from "./majors/majors.router";
import { auth } from "./middleware/auth";
import { roomsRouter } from "./rooms/rooms.router";
import { subjectsRouter } from "./subjects/subjects.router";
import { ticketsRouter } from "./tickets/tickets.router";
import swaggerDocument from "./swagger/swagger-output.json";
import { usersRouter } from "./users/users.router";

const PORT = Number(process.env.PORT) || 4000;

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  ...(process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) ?? []),
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
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
app.use("/rooms", roomsRouter);
app.use("/conversations", conversationsRouter);
app.use("/tickets", ticketsRouter);
app.use("/assessments", assessmentsRouter);

app.get(
  "/permissions-config",
  auth({ authorization: "session", roles: [Role.superadmin] }),
  (_req, res) => {
    // #swagger.tags = ['Config']
    res.json(permissionsConfig);
  },
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const filesService = new FilesService();
cron.schedule("0 4 * * *", () => {
  filesService
    .cleanDeletedFiles()
    .catch((err) => console.error("Cron: file cleanup failed", err));
});

const httpServer = createServer(app);
initSocket(httpServer);

const start = async () => {
  await connectPostgres();
  await connectRedis();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
