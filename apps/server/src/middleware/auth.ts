import type { NextFunction, Request, Response } from "express";

import { Role } from "@prisma/client";

import type { Permission } from "../config/permissions.config";
import { verifyAccessToken } from "../lib/jwt";
import { getAdminSession } from "../lib/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface AuthOptions {
  authorization: "session" | "jwt";
  roles: Role[];
  permissions?: Permission[] | null;
  allowIfMustChangePassword?: boolean;
}

export const validateCsrf = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const csrfCookie = req.cookies?.csrf_token as string | undefined;
  const csrfHeader = req.headers["x-csrf-token"] as string | undefined;
  if (!csrfCookie || csrfCookie !== csrfHeader) {
    res.status(403).json({ message: "Invalid CSRF token" });
    return;
  }
  next();
};

/**
 * Routes reachable by both client (JWT) and admin (session) users. Picks the
 * scheme by the presence of a `session_id` cookie.
 */
export const authEither = (options: {
  clientRoles: Role[];
  adminRoles: Role[];
  permissions?: Permission[];
}) =>
  (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sessionId = req.cookies?.session_id as string | undefined;
    if (sessionId) {
      return auth({
        authorization: "session",
        roles: options.adminRoles,
        permissions: options.permissions ?? null,
      })(req, res, next);
    }
    return auth({ authorization: "jwt", roles: options.clientRoles })(req, res, next);
  };

export const auth = (options: AuthOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (options.authorization === "session") {
      const sessionId = req.cookies?.session_id as string | undefined;
      if (!sessionId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      if (!SAFE_METHODS.has(req.method)) {
        const csrfCookie = req.cookies?.csrf_token as string | undefined;
        const csrfHeader = req.headers["x-csrf-token"] as string | undefined;
        if (!csrfCookie || csrfCookie !== csrfHeader) {
          res.status(403).json({ message: "Invalid CSRF token" });
          return;
        }
      }

      const session = await getAdminSession(sessionId);
      if (!session) {
        res.status(401).json({ message: "Session expired, please log in again" });
        return;
      }

      let user;
      try {
        user = verifyAccessToken(session.accessToken);
      } catch {
        res.status(401).json({ message: "Session expired, please log in again" });
        return;
      }

      if (!options.roles.includes(user.role)) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      if (user.role === Role.it && options.permissions?.length) {
        const hasPermission = options.permissions.some((p) =>
          user.permissions.includes(p),
        );
        if (!hasPermission) {
          res.status(403).json({ message: "Insufficient permissions" });
          return;
        }
      }

      if (user.mustChangePassword && !options.allowIfMustChangePassword) {
        res.status(403).json({
          code: "MUST_CHANGE_PASSWORD",
          message: "You must change your password before continuing",
        });
        return;
      }

      req.user = user;
      req.sessionId = sessionId;
      next();
      return;
    }

    // JWT auth (client)
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const token = authHeader.slice(7);
    let user;
    try {
      user = verifyAccessToken(token);
    } catch {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    if (user.role === Role.it || user.role === Role.superadmin) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    if (!options.roles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (user.mustChangePassword && !options.allowIfMustChangePassword) {
      res.status(403).json({
        code: "MUST_CHANGE_PASSWORD",
        message: "You must change your password before continuing",
      });
      return;
    }

    req.user = user;
    next();
  };
