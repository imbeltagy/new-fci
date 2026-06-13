"use client";

import { COOKIES } from "../../constants/cookies";
import { deleteCookie, getCookie, setCookie } from "../cookies";
import { apiLogger } from "./api-logger";
import { classifyFetchError, extractErrorMessage } from "./error-handlers/extract-error";
import { buildUrl, formDataToObject, getResponsePayload } from "./helpers";
import type { APIMethod, ApiClientErrorResponse, ApiClientResponse, ApiClientSuccessResponse, RequestOptions } from "./types";

const GENERIC_ERROR = "Something went wrong. Please try again.";
type AuthType = "session" | "jwt";

class ApiClient {
  private baseUrl: string;
  private guest: boolean;
  private authType: AuthType;

  constructor({ baseUrl, guest }: { baseUrl: string; guest: boolean }) {
    this.baseUrl = baseUrl;
    this.guest = guest;
    this.authType = (process.env.NEXT_PUBLIC_AUTH_TYPE as AuthType) ?? "jwt";
  }

  private buildAuthHeaders(): Record<string, string> {
    if (this.guest) return {};

    if (this.authType === "session") {
      const csrf = getCookie(COOKIES.CSRF_TOKEN);
      if (!csrf) throw new Error("no_csrf_token");
      return { "X-CSRF-Token": csrf };
    }

    const token = getCookie(COOKIES.ACCESS_TOKEN);
    if (!token) throw new Error("no_access_token");
    return { Authorization: `Bearer ${token}` };
  }

  private errorResponse(status: number, message: string): ApiClientErrorResponse {
    return { success: false, message, data: null, status };
  }

  private async handleUnauthorized<T>(
    path: string,
    method: APIMethod,
    options?: RequestOptions
  ): Promise<ApiClientResponse<T>> {
    try {
      if (this.authType === "session") {
        const csrf = getCookie(COOKIES.CSRF_TOKEN) ?? "";
        const refreshRes = await fetch(buildUrl(this.baseUrl, "/auth/admin/refresh"), {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": csrf },
        });
        if (refreshRes.ok) {
          return this.request<T>(path, method, options, true);
        }
        // Refresh failed — logout and reload
        await fetch(buildUrl(this.baseUrl, "/auth/admin/logout"), {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": csrf },
        });
      } else {
        const refreshToken = getCookie(COOKIES.REFRESH_TOKEN);
        if (!refreshToken) throw new Error("no_refresh_token");

        const refreshRes = await fetch(buildUrl(this.baseUrl, "/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data?.accessToken) setCookie(COOKIES.ACCESS_TOKEN, data.accessToken);
          if (data?.refreshToken) setCookie(COOKIES.REFRESH_TOKEN, data.refreshToken);
          return this.request<T>(path, method, options, true);
        }
        // Refresh failed — clear tokens
        deleteCookie(COOKIES.ACCESS_TOKEN);
        deleteCookie(COOKIES.REFRESH_TOKEN);
        deleteCookie(COOKIES.USER);
      }
    } catch {
      // fall through to reload
    }

    if (typeof window !== "undefined") window.location.reload();
    return this.errorResponse(401, "Session expired");
  }

  private async request<T>(
    path: string,
    method: APIMethod,
    options?: RequestOptions,
    retried = false
  ): Promise<ApiClientResponse<T>> {
    const url = buildUrl(this.baseUrl, path, options?.params, options?.queries);

    try {
      const authHeaders = this.buildAuthHeaders();
      const headers: Record<string, string> = { ...authHeaders, ...(options?.headers ?? {}) };

      if (options?.body && !(options.body instanceof FormData)) {
        if (options.body instanceof URLSearchParams) {
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        } else {
          headers["Content-Type"] = "application/json";
        }
      }

      const res = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body:
          options?.body instanceof FormData || options?.body instanceof URLSearchParams
            ? (options.body as BodyInit)
            : options?.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,
        cache: options?.cache,
        ...(options?.next && { next: options.next }),
      });

      // ── Error path ─────────────────────────────────────────────────────────
      if (!res.ok) {
        const isAuthEndpoint =
          path === "/auth/refresh" ||
          path === "/auth/admin/refresh" ||
          path === "/auth/admin/logout";

        if (
          (res.status === 401 || res.status === 403) &&
          !retried &&
          !isAuthEndpoint &&
          !this.guest &&
          typeof window !== "undefined"
        ) {
          return this.handleUnauthorized<T>(path, method, options);
        }

        const { payload } = await getResponsePayload(res);
        const errorMessage = extractErrorMessage(payload);

        apiLogger({
          method,
          url,
          status: res.status,
          requestBody:
            options?.body instanceof FormData
              ? formDataToObject(options.body)
              : options?.body instanceof URLSearchParams
                ? Object.fromEntries(options.body)
                : (options?.body as object | undefined),
          errorMessage,
          errorPayload: payload,
        });

        const responseMessage =
          !errorMessage?.trim() ||
          /^<(!DOCTYPE|html|body|head)/i.test(errorMessage)
            ? GENERIC_ERROR
            : errorMessage;

        return this.errorResponse(res.status, responseMessage);
      }

      // ── Success path ───────────────────────────────────────────────────────
      if (res.status === 204) {
        return {
          success: true,
          message: "Success",
          data: undefined as T,
          status: 200,
        } satisfies ApiClientSuccessResponse<T>;
      }

      const { payload } = await getResponsePayload(res);
      return {
        success: true,
        message: extractMessage(payload) ?? "Success",
        data: payload as T,
        status: res.status,
      } satisfies ApiClientSuccessResponse<T>;
    } catch (error: unknown) {
      // Re-throw Next.js internal errors (digest errors from static generation)
      if (error instanceof Error && "digest" in error) throw error;

      if (error instanceof Error) {
        if (error.message === "no_access_token" || error.message === "no_csrf_token") {
          return this.errorResponse(401, "Unauthorized");
        }
      }

      const { isNetwork, isTimeout } = classifyFetchError(error);
      if (isNetwork) {
        return this.errorResponse(0, "Network error. Please check your connection.");
      }
      if (isTimeout) {
        return this.errorResponse(0, "Request timed out. Please try again.");
      }

      apiLogger({
        method,
        url,
        status: 500,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      return this.errorResponse(500, GENERIC_ERROR);
    }
  }

  get<T = void>(path: string, options?: Omit<RequestOptions, "body">): Promise<ApiClientResponse<T>> {
    return this.request<T>(path, "GET", options);
  }

  post<T = void>(path: string, body: object | FormData, options?: Omit<RequestOptions, "body">): Promise<ApiClientResponse<T>> {
    return this.request<T>(path, "POST", { ...options, body });
  }

  patch<T = void>(path: string, body: object | FormData, options?: Omit<RequestOptions, "body">): Promise<ApiClientResponse<T>> {
    return this.request<T>(path, "PATCH", { ...options, body });
  }

  put<T = void>(path: string, body: object | FormData, options?: Omit<RequestOptions, "body">): Promise<ApiClientResponse<T>> {
    return this.request<T>(path, "PUT", { ...options, body });
  }

  delete<T = void>(path: string, options?: Omit<RequestOptions, "body">): Promise<ApiClientResponse<T>> {
    return this.request<T>(path, "DELETE", options);
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  return typeof p["message"] === "string" ? p["message"] : undefined;
}

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  guest: false,
});

export const apiGuest = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  guest: true,
});

export type { ApiClientResponse, ApiClientSuccessResponse, ApiClientErrorResponse };
