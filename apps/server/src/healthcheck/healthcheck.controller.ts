import { Router, type Request, type Response } from "express";

import { HealthcheckService } from "./healthcheck.service";

const healthcheckService = new HealthcheckService();

export const healthcheckRouter = Router();

healthcheckRouter.get("/", async (_req: Request, res: Response) => {
  const status = await healthcheckService.getStatus();
  res.status(status.status === "ok" ? 200 : 503).json(status);
});
