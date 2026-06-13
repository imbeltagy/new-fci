import { notifyMonitoringSystem } from "./error-handlers/notify-monitoring-system";

export function apiLogger({
  method,
  url,
  status,
  requestBody,
  errorPayload,
  errorMessage,
}: {
  method: string;
  url: string;
  status: number;
  requestBody?: object;
  errorPayload?: unknown;
  errorMessage?: string;
}): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${method}] ${url} failed`, { status, requestBody, errorPayload });
  }

  if (process.env.NODE_ENV !== "development") {
    notifyMonitoringSystem({
      message: errorMessage ?? "Unknown error",
      method,
      url,
      status,
      body: requestBody,
    });
  }
}
