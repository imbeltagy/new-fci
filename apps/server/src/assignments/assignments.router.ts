import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./assignments.controller";
import { AssignMajorDto } from "./dto/request/assign-major.dto";

const anyAdmin: Role[] = [Role.it, Role.superadmin];

export const assignmentsRouter = Router({ mergeParams: true });

assignmentsRouter.get(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.getAssignments,
);

assignmentsRouter.post(
  "/join-years/:joinYearId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.assignJoinYear,
);

assignmentsRouter.delete(
  "/join-years/:joinYearId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.removeJoinYear,
);

assignmentsRouter.post(
  "/majors",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(AssignMajorDto),
  ctrl.assignMajor,
);

assignmentsRouter.delete(
  "/majors/:majorId/:joinYearId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.removeMajor,
);

assignmentsRouter.post(
  "/subjects/:subjectId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.assignSubject,
);

assignmentsRouter.delete(
  "/subjects/:subjectId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.removeSubject,
);
