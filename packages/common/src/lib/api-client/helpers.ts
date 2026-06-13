import type { Params, Queries, Query, ResponseContentType } from "./types";

export function convertQueriesToString(queries?: Queries): string {
  if (!queries) return "";
  const params = new URLSearchParams();

  function append(key: string, value: Query) {
    if (value === undefined) return;
    params.append(key, String(value));
  }

  for (const [key, value] of Object.entries(queries)) {
    if (Array.isArray(value)) {
      value.forEach((v) => append(key, v));
    } else {
      append(key, value);
    }
  }
  return params.toString();
}

function replaceParams(url: string, params?: Params): string {
  if (!params) return url;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`:${key}\\b`, "g"), value),
    url
  );
}

export function buildUrl(baseUrl: string, path: string, params?: Params, queries?: Queries): string {
  let url = baseUrl + replaceParams(path, params);
  const qs = convertQueriesToString(queries);
  if (qs) url += (path.includes("?") ? "&" : "?") + qs;
  return url;
}

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    obj[key] = value as string;
  });
  return obj;
}

export async function getResponsePayload(res: Response): Promise<{ payload: unknown; type: ResponseContentType }> {
  const ct = res.headers.get("content-type") ?? "";
  let payload: unknown;
  let type: ResponseContentType = "undefined";

  if (ct.includes("application/json") || ct.includes("application/problem+json")) {
    type = "json";
    payload = await res.json();
  } else if (
    ct.includes("application/octet-stream") ||
    ct.includes("application/pdf") ||
    ct.includes("application/vnd.")
  ) {
    type = "blob";
    payload = await res.blob();
  } else if (ct.startsWith("text/")) {
    type = "text";
    payload = await res.text();
  } else {
    type = "undefined";
    payload = undefined;
  }

  return { payload, type };
}
