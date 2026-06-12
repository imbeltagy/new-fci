import jwt from "jsonwebtoken";

import type { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  permissions: string[];
  mustChangePassword: boolean;
}

const ACCESS_SECRET = () => {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("JWT_ACCESS_SECRET is not defined");
  return s;
};

const REFRESH_SECRET = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is not defined");
  return s;
};

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, ACCESS_SECRET(), { expiresIn: "30m" });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, REFRESH_SECRET(), { expiresIn: "7d" });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, ACCESS_SECRET()) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): { sub: string } =>
  jwt.verify(token, REFRESH_SECRET()) as { sub: string };

/** Decode without verifying — used only for cleanup when refresh fails. */
export const decodeRefreshToken = (token: string): { sub: string } | null => {
  const payload = jwt.decode(token);
  if (!payload || typeof payload !== "object") return null;
  return payload as { sub: string };
};

/** Unix timestamp 7 days from now — used to set Redis TTL on sessions. */
export const refreshTokenExpiry = (): number =>
  Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
