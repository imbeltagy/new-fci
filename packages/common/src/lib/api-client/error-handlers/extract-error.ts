export function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload) return undefined;
  try {
    if (typeof payload === "string") return payload;
    if (Array.isArray(payload)) {
      return payload.map(extractErrorMessage).filter(Boolean).join(", ");
    }
    if (typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      if (typeof p["detail"] === "string") return p["detail"].trim();
      if (typeof p["error_description"] === "string") return p["error_description"].trim();
      if (typeof p["error"] === "string") return p["error"].trim();
      if (typeof p["message"] === "string") return p["message"].trim();
      if (typeof p["title"] === "string") return p["title"].trim();
      if (typeof p["body"] === "object") return extractErrorMessage(p["body"]);
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function classifyFetchError(error: unknown): { isNetwork: boolean; isTimeout: boolean } {
  const err = error as { name?: string; message?: string };
  const name = err?.name ?? "";
  const msg = (err?.message ?? "").toLowerCase();

  const isAbort = name === "AbortError";
  const isTypeError = name === "TypeError";
  const networkHints = [
    "failed to fetch",
    "networkerror",
    "network error",
    "load failed",
    "fetch failed",
    "connection refused",
    "connection reset",
    "dns",
    "enotfound",
    "econnrefused",
    "econnreset",
  ];

  return {
    isNetwork: isTypeError && (networkHints.some((h) => msg.includes(h)) || !msg),
    isTimeout: isAbort || msg.includes("timeout"),
  };
}
