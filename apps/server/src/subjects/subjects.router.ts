import { Router } from "express";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./subjects.controller";
import { AssignStaffToSubjectDto } from "./dto/request/assign-staff.dto";
import { CreateSubjectDto } from "./dto/request/create-subject.dto";
import { UpdateSubjectDto } from "./dto/request/update-subject.dto";

const anyAdmin: Role[] = [Role.it, Role.superadmin];
const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];

export const subjectsRouter = Router();

subjectsRouter.get(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.listSubjects,
);

subjectsRouter.post(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(CreateSubjectDto),
  ctrl.createSubject,
);

subjectsRouter.get(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.getSubject,
);

subjectsRouter.patch(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(UpdateSubjectDto),
  ctrl.updateSubject,
);

subjectsRouter.delete(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.deleteSubject,
);

subjectsRouter.get(
  "/:id/staff",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.getSubjectStaff,
);

subjectsRouter.post(
  "/:id/staff",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  validateBody(AssignStaffToSubjectDto),
  ctrl.assignSubjectStaff,
);

subjectsRouter.delete(
  "/:id/staff/:userId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.removeSubjectStaff,
);

subjectsRouter.get(
  "/:id/enrollments",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.getEnrollments,
);

subjectsRouter.post(
  "/:id/enrollments/bulk",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.bulkEnroll,
);

subjectsRouter.post(
  "/:id/enrollments/:userId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.enrollStudent,
);

subjectsRouter.delete(
  "/:id/enrollments/:userId",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.SUBJECTS_MANAGE] }),
  ctrl.unenrollStudent,
);
