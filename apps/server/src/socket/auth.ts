import { Role } from "@prisma/client";

import { verifyAccessToken } from "../lib/jwt";
import { getAdminSession } from "../lib/session";
import type { AppSocket } from "./types";

/** Minimal cookie-header parser — we only need a couple of named cookies. */
function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

/**
 * Socket handshake auth. Clients authenticate with a JWT access token passed in
 * `handshake.auth.token`; admins authenticate with their `session_id` cookie
 * (the access token is retrieved from Redis, same as the HTTP session flow).
 */
export async function authenticateSocket(
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth?.["token"] as string | undefined;

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload.role === Role.it || payload.role === Role.superadmin) {
        next(new Error("Invalid token"));
        return;
      }
      socket.data.user = {
        sub: payload.sub,
        role: payload.role,
        permissions: payload.permissions ?? [],
      };
      next();
      return;
    }

    const cookies = parseCookies(socket.handshake.headers.cookie);
    const sessionId = cookies["session_id"];
    if (sessionId) {
      const session = await getAdminSession(sessionId);
      if (!session) {
        next(new Error("Session expired"));
        return;
      }
      const payload = verifyAccessToken(session.accessToken);
      socket.data.user = {
        sub: payload.sub,
        role: payload.role,
        permissions: payload.permissions ?? [],
      };
      next();
      return;
    }

    next(new Error("Authentication required"));
  } catch {
    next(new Error("Authentication failed"));
  }
}
