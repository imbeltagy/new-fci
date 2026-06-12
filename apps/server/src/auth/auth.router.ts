import { Router } from "express";
import rateLimit from "express-rate-limit";

import { Role } from "@prisma/client";

import { auth, validateCsrf } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as authController from "./auth.controller";
import { ChangePasswordDto } from "./dto/request/change-password.dto";
import { ClientRefreshDto } from "./dto/request/client-refresh.dto";
import { ConfirmPasswordResetDto } from "./dto/request/confirm-password-reset.dto";
import { LoginDto } from "./dto/request/login.dto";
import { RequestPasswordResetDto } from "./dto/request/request-password-reset.dto";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];

export const authRouter = Router();

// Public
authRouter.post(
  "/login",
  loginLimiter,
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/LoginDto' } } */
  validateBody(LoginDto),
  authController.clientLogin,
);
authRouter.post(
  "/admin/login",
  loginLimiter,
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/LoginDto' } } */
  validateBody(LoginDto),
  authController.adminLogin,
);
authRouter.post(
  "/refresh",
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/ClientRefreshDto' } } */
  validateBody(ClientRefreshDto),
  authController.clientRefresh,
);

// CSRF-protected, session validated in handler
authRouter.post("/admin/refresh", validateCsrf, authController.adminRefresh);

// Admin (session)
authRouter.post(
  "/admin/logout",
  auth({ authorization: "session", roles: anyAdmin }),
  authController.adminLogout,
);

// Public
authRouter.post(
  "/password-reset/request",
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/RequestPasswordResetDto' } } */
  validateBody(RequestPasswordResetDto),
  authController.requestPasswordReset,
);
authRouter.post(
  "/password-reset/confirm",
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/ConfirmPasswordResetDto' } } */
  validateBody(ConfirmPasswordResetDto),
  authController.confirmPasswordReset,
);

// Client (JWT)
authRouter.post(
  "/change-password",
  auth({ authorization: "jwt", roles: anyClient, allowIfMustChangePassword: true }),
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/ChangePasswordDto' } } */
  validateBody(ChangePasswordDto),
  authController.changePassword,
);

// Admin (session)
authRouter.post(
  "/admin/change-password",
  auth({ authorization: "session", roles: anyAdmin, allowIfMustChangePassword: true }),
  /* #swagger.parameters['body'] = { in:'body', required:true, schema:{ $ref:'#/definitions/ChangePasswordDto' } } */
  validateBody(ChangePasswordDto),
  authController.adminChangePassword,
);
