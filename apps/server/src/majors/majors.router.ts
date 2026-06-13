import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth, authEither } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./majors.controller";
import { AssignStaffToMajorDto } from "./dto/request/assign-staff.dto";
import { CreateMajorDto } from "./dto/request/create-major.dto";
import { UpdateMajorDto } from "./dto/request/update-major.dto";

const anyAdmin: Role[] = [Role.it, Role.superadmin];
const facultyRoles: Role[] = [Role.teacher, Role.sub_teacher];

export const majorsRouter = Router();

majorsRouter.get(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.listMajors,
);

// Client-facing major detail — faculty assigned to the (major × join year) / admins.
majorsRouter.get(
  "/:id/detail",
  authEither({ clientRoles: facultyRoles, adminRoles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.getMajorDetail,
);

majorsRouter.post(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  validateBody(CreateMajorDto),
  ctrl.createMajor,
);

majorsRouter.get(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.getMajor,
);

majorsRouter.patch(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  validateBody(UpdateMajorDto),
  ctrl.updateMajor,
);

majorsRouter.delete(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.deleteMajor,
);

majorsRouter.get(
  "/:id/staff",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.getMajorStaff,
);

majorsRouter.post(
  "/:id/staff",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  validateBody(AssignStaffToMajorDto),
  ctrl.assignMajorStaff,
);

majorsRouter.delete(
  "/:id/staff/:userId/:joinYearId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.MAJORS_MANAGE] }),
  ctrl.removeMajorStaff,
);
