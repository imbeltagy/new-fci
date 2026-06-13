"use client";

import { API_ROUTES } from "../constants/api";
import { COOKIES } from "../constants/cookies";
import { setCookie, deleteCookie } from "../lib/cookies";
import { api, apiGuest } from "../lib/api-client";
import type {
  AdminLoginResponse,
  AdminRefreshResponse,
  ChangePasswordResponse,
  ClientLoginResponse,
  TokenPairResponse,
} from "../types/auth";

export async function clientLogin(email: string, password: string) {
  const res = await apiGuest.post<ClientLoginResponse>(API_ROUTES.auth.clientLogin, {
    email,
    password,
  });
  if (res.success && res.data) {
    setCookie(COOKIES.ACCESS_TOKEN, res.data.accessToken);
    setCookie(COOKIES.REFRESH_TOKEN, res.data.refreshToken);
    setCookie(COOKIES.USER, encodeURIComponent(JSON.stringify(res.data.user)));
    setCookie(COOKIES.SHOULD_CHANGE_PASSWORD, res.data.user.mustChangePassword ? "true" : "false");
  }
  return res;
}

export async function adminLogin(email: string, password: string) {
  const res = await apiGuest.post<AdminLoginResponse>(API_ROUTES.auth.adminLogin, {
    email,
    password,
  });
  if (res.success && res.data) {
    setCookie(COOKIES.USER, encodeURIComponent(JSON.stringify(res.data.user)));
    setCookie(COOKIES.SHOULD_CHANGE_PASSWORD, res.data.user.mustChangePassword ? "true" : "false");
  }
  return res;
}

export async function clientRefresh(refreshToken: string) {
  return apiGuest.post<TokenPairResponse>(API_ROUTES.auth.clientRefresh, { refreshToken });
}

export async function adminRefresh() {
  return apiGuest.post<AdminRefreshResponse>(API_ROUTES.auth.adminRefresh, {});
}

export async function adminLogout() {
  const res = await api.post(API_ROUTES.auth.adminLogout, {});
  deleteCookie(COOKIES.USER);
  return res;
}

export async function requestPasswordReset(email: string) {
  return apiGuest.post(API_ROUTES.auth.requestPasswordReset, { email });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  return apiGuest.post(API_ROUTES.auth.confirmPasswordReset, { token, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await api.post<ChangePasswordResponse>(API_ROUTES.auth.changePassword, {
    currentPassword,
    newPassword,
  });
  if (res.success && res.data) {
    if (res.data.accessToken) setCookie(COOKIES.ACCESS_TOKEN, res.data.accessToken);
    if (res.data.refreshToken) setCookie(COOKIES.REFRESH_TOKEN, res.data.refreshToken);
    setCookie(COOKIES.SHOULD_CHANGE_PASSWORD, "false");
  }
  return res;
}

export async function adminChangePassword(currentPassword: string, newPassword: string) {
  const res = await api.post<ChangePasswordResponse>(API_ROUTES.auth.adminChangePassword, {
    currentPassword,
    newPassword,
  });
  if (res.success) {
    setCookie(COOKIES.SHOULD_CHANGE_PASSWORD, "false");
  }
  return res;
}
