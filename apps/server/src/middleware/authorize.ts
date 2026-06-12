import type { NextFunction, Request, Response } from "express";

import { Role } from "@prisma/client";

import { lookupRoute } from "../config/router.config";

export const authorize = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const config = lookupRoute(req.path);

  if (!config) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  // Public route
  if (config.roles === null) {
    next();
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (!config.roles.includes(req.user.role)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  // IT users additionally need a matching permission (unless route allows any IT)
  if (req.user.role === Role.it && config.perms !== null) {
    const hasPermission = config.perms.some((p) =>
      req.user!.permissions.includes(p),
    );
    if (!hasPermission) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
  }

  // Block all actions except change-password when a password change is forced
  if (req.user.mustChangePassword && req.path !== "/auth/change-password") {
    res.status(403).json({
      code: "MUST_CHANGE_PASSWORD",
      message: "You must change your password before continuing",
    });
    return;
  }

  next();
};
