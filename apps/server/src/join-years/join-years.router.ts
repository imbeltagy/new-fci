import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./join-years.controller";
import { CreateJoinYearDto } from "./dto/request/create-join-year.dto";
import { UpdateJoinYearDto } from "./dto/request/update-join-year.dto";

const anyAdmin: Role[] = [Role.it, Role.superadmin];

export const joinYearsRouter = Router();

joinYearsRouter.get(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.listJoinYears,
);

joinYearsRouter.post(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(CreateJoinYearDto),
  ctrl.createJoinYear,
);

joinYearsRouter.get(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.getJoinYear,
);

joinYearsRouter.patch(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(UpdateJoinYearDto),
  ctrl.updateJoinYear,
);

joinYearsRouter.delete(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.deleteJoinYear,
);
