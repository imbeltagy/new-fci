import { Router } from "express";

import * as healthcheckController from "./healthcheck.controller";

export const healthcheckRouter = Router();

healthcheckRouter.get("/", healthcheckController.getStatus);
