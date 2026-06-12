import { randomBytes } from "crypto";

import { Role } from "@prisma/client";

import { comparePassword, hashPassword } from "../lib/bcrypt";
import { sendPasswordResetEmail } from "../lib/email";
import {
  type AccessTokenPayload,
  decodeRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSession,
  updateAdminSessionAccessToken,
} from "../lib/session";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private readonly repo = new AuthRepository()) {}

  // ── Shared helpers ─────────────────────────────────────────────────────────

  private buildPayload(user: {
    id: string;
    role: Role;
    mustChangePassword: boolean;
    accessGroup: { permissions: { key: string }[] } | null;
  }): AccessTokenPayload {
    return {
      sub: user.id,
      role: user.role,
      permissions: user.accessGroup?.permissions.map((p) => p.key) ?? [],
      mustChangePassword: user.mustChangePassword,
    };
  }

  private issueTokens(payload: AccessTokenPayload) {
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload.sub),
    };
  }

  // ── Client login ───────────────────────────────────────────────────────────

  async clientLogin(email: string, password: string) {
    const user = await this.repo.findActiveUserByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const isAdmin = user.role === Role.it || user.role === Role.superadmin;
    if (isAdmin) {
      throw Object.assign(
        new Error("Admin accounts must use the admin login"),
        { status: 403 },
      );
    }

    const payload = this.buildPayload(user);
    const tokens = this.issueTokens(payload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // ── Admin login ────────────────────────────────────────────────────────────

  async adminLogin(email: string, password: string) {
    const user = await this.repo.findActiveUserByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const isAdmin = user.role === Role.it || user.role === Role.superadmin;
    if (!isAdmin) {
      throw Object.assign(
        new Error("This login is for admin accounts only"),
        { status: 403 },
      );
    }

    const payload = this.buildPayload(user);
    const { accessToken, refreshToken } = this.issueTokens(payload);
    const expiresAt = refreshTokenExpiry();

    const { sessionId, csrfToken } = await createAdminSession(
      user.id,
      accessToken,
      refreshToken,
      expiresAt,
    );

    return {
      sessionId,
      csrfToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // ── Client token refresh ───────────────────────────────────────────────────

  async clientRefresh(refreshToken: string) {
    let sub: string;
    try {
      ({ sub } = verifyRefreshToken(refreshToken));
    } catch {
      throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
    }

    const user = await this.repo.findActiveUserById(sub);
    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 401 });
    }

    const payload = this.buildPayload(user);
    return this.issueTokens(payload);
  }

  // ── Admin logout ───────────────────────────────────────────────────────────

  async adminLogout(sessionId: string, userId: string): Promise<void> {
    await deleteAdminSession(sessionId, userId);
  }

  // ── Admin token refresh ────────────────────────────────────────────────────

  async adminRefresh(sessionId: string) {
    const session = await getAdminSession(sessionId);
    if (!session) {
      throw Object.assign(new Error("Session expired, please log in again"), { status: 401 });
    }

    try {
      const { sub } = verifyRefreshToken(session.refreshToken);
      const user = await this.repo.findActiveUserById(sub);
      const isAdmin = user?.role === Role.it || user?.role === Role.superadmin;
      if (!user || !isAdmin) throw new Error("Forbidden");

      const payload = this.buildPayload(user);
      const newAccessToken = signAccessToken(payload);
      await updateAdminSessionAccessToken(sessionId, newAccessToken);

      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      };
    } catch {
      // Refresh token invalid or expired — clean up session and force re-login
      const decoded = decodeRefreshToken(session.refreshToken);
      if (decoded?.sub) await deleteAdminSession(sessionId, decoded.sub);
      throw Object.assign(new Error("Session expired, please log in again"), { status: 401 });
    }
  }

  // ── Password reset ─────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repo.findActiveUserByEmail(email);
    if (!user) return; // no enumeration

    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.repo.createPasswordResetToken(user.id, rawToken, expiresAt);
    await sendPasswordResetEmail(email, rawToken);
  }

  async confirmPasswordReset(rawToken: string, newPassword: string): Promise<void> {
    const record = await this.repo.findValidResetToken(rawToken);
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw Object.assign(new Error("Token is invalid or expired"), { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repo.updatePassword(record.userId, passwordHash);
    await this.repo.markResetTokenUsed(record.id);
  }

  // ── Change password (authenticated) ────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    sessionId?: string,
  ) {
    const user = await this.repo.findActiveUserById(userId);
    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    if (!(await comparePassword(currentPassword, user.passwordHash))) {
      throw Object.assign(new Error("Current password is incorrect"), { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repo.updatePassword(userId, passwordHash);

    // Refresh tokens so mustChangePassword is cleared in the payload
    const payload = this.buildPayload({ ...user, mustChangePassword: false });
    const { accessToken, refreshToken } = this.issueTokens(payload);

    if (sessionId) {
      // Admin: update the session's access token in Redis (no new cookies needed)
      await updateAdminSessionAccessToken(sessionId, accessToken);
      return { user: { id: user.id, email: user.email } };
    }

    // Client: return new token pair
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }
}
