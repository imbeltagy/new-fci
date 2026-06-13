export function notifyMonitoringSystem({
  message,
  url,
  method,
  status,
  body,
}: {
  message: string;
  method: string;
  url: string;
  status?: number;
  body?: object;
}): void {
  // TODO: wire up to a real monitoring service (e.g. Sentry, Datadog)
  const _payload = `[${method}] ${url} | ${status} | ${message} | ${body ? JSON.stringify(body) : ""}`;
}
