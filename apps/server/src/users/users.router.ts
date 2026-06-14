import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";

import { Role } from "@prisma/client";

import { Permission } from "../config/permissions.config";
import { auth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as usersController from "./users.controller";
import { CreateManyUsersDto } from "./dto/request/create-many-users.dto";
import { CreateUserDto } from "./dto/request/create-user.dto";
import { SendCredentialsDto } from "./dto/request/send-credentials.dto";
import { UpdateMeDto } from "./dto/request/update-me.dto";
import { UpdateUserDto } from "./dto/request/update-user.dto";

const upload = multer({ storage: multer.memoryStorage() });

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];

// Accepts either session (admin) or JWT (client) for self-profile endpoints.
function authSelf(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.session_id as string | undefined;
  if (sessionId) {
    return auth({ authorization: "session", roles: anyAdmin })(req, res, next);
  }
  return auth({ authorization: "jwt", roles: anyClient })(req, res, next);
}

export const usersRouter = Router();

// Admin (session)
usersRouter.get(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_READ] }),
  usersController.listUsers,
);

usersRouter.post(
  "/",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_CREATE] }),
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/CreateUserDto' } } */
  validateBody(CreateUserDto),
  usersController.createUser,
);

usersRouter.post(
  "/bulk",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_CREATE] }),
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/CreateManyUsersDto' } } */
  validateBody(CreateManyUsersDto),
  usersController.createManyUsers,
);

// Self-profile — accepts both session (admin) and JWT (client). Must be before /:id.
usersRouter.get("/me", authSelf, usersController.getMe);

// Public profile by email — accessible to any authenticated client.
usersRouter.get(
  "/profile/:email",
  auth({ authorization: "jwt", roles: anyClient }),
  usersController.getUserProfile,
);

usersRouter.get(
  "/me/subjects",
  auth({ authorization: "jwt", roles: anyClient }),
  usersController.getMySubjects,
);

usersRouter.patch(
  "/me",
  authSelf,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  validateBody(UpdateMeDto),
  usersController.updateMe,
);

// Admin (session)
usersRouter.post(
  "/send-credentials",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_CREATE] }),
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/SendCredentialsDto' } } */
  validateBody(SendCredentialsDto),
  usersController.sendCredentials,
);

usersRouter.get(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_READ] }),
  usersController.getUser,
);

usersRouter.patch(
  "/:id",
  auth({
    authorization: "session",
    roles: anyAdmin,
    permissions: [Permission.USERS_UPDATE, Permission.USERS_DEACTIVATE],
  }),
  /* #swagger.parameters['body'] = { in:'body', schema:{ $ref:'#/definitions/UpdateUserDto' } } */
  validateBody(UpdateUserDto),
  usersController.updateUser,
);

usersRouter.delete(
  "/:id",
  auth({ authorization: "session", roles: anyAdmin, permissions: [Permission.USERS_DELETE] }),
  usersController.deleteUser,
);
