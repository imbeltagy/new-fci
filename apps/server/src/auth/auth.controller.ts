import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import type { ChangePasswordDto } from "./dto/request/change-password.dto";
import type { ClientRefreshDto } from "./dto/request/client-refresh.dto";
import type { ConfirmPasswordResetDto } from "./dto/request/confirm-password-reset.dto";
import type { LoginDto } from "./dto/request/login.dto";
import type { RequestPasswordResetDto } from "./dto/request/request-password-reset.dto";

const authService = new AuthService();

const COOKIE_BASE = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

export async function clientLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginDto;
    res.json(await authService.clientLogin(email, password));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginDto;
    const { sessionId, csrfToken, expiresAt, user } =
      await authService.adminLogin(email, password);
    const maxAge = (expiresAt - Math.floor(Date.now() / 1000)) * 1000;
    res
      .cookie("session_id", sessionId, { ...COOKIE_BASE, httpOnly: true, maxAge })
      .cookie("csrf_token", csrfToken, { ...COOKIE_BASE, maxAge })
      .json({ user });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function clientRefresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as ClientRefreshDto;
    res.json(await authService.clientRefresh(refreshToken));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function adminRefresh(req: Request, res: Response) {
  const sessionId = req.cookies?.session_id as string | undefined;
  if (!sessionId) {
    res.status(401).json({ message: "No session" });
    return;
  }
  try {
    res.json(await authService.adminRefresh(sessionId));
  } catch (err: any) {
    res
      .clearCookie("session_id")
      .clearCookie("csrf_token")
      .status(err.status ?? 500)
      .json({ message: err.message });
  }
}

export async function adminLogout(req: Request, res: Response) {
  try {
    await authService.adminLogout(req.sessionId!, req.user!.sub);
    res.clearCookie("session_id").clearCookie("csrf_token").sendStatus(200);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body as RequestPasswordResetDto;
  await authService.requestPasswordReset(email);
  res.sendStatus(200);
}

export async function confirmPasswordReset(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body as ConfirmPasswordResetDto;
    await authService.confirmPasswordReset(token, newPassword);
    res.sendStatus(200);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordDto;
    res.json(
      await authService.changePassword(req.user!.sub, currentPassword, newPassword),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function adminChangePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordDto;
    res.json(
      await authService.changePassword(
        req.user!.sub,
        currentPassword,
        newPassword,
        req.sessionId,
      ),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
