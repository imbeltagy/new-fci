import type { Request, Response } from "express";

import { HealthcheckService } from "./healthcheck.service";

const healthcheckService = new HealthcheckService();

export async function getStatus(_req: Request, res: Response) {
  const status = await healthcheckService.getStatus();
  res.status(status.status === "ok" ? 200 : 503).json(status);
}
