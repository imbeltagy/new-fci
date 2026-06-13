export type APIMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type Query = string | number | boolean | undefined;
export type Queries = Record<string, Query | Query[]>;
export type Params = Record<string, string>;

export type RequestOptions = {
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: {
    tags?: string[];
    revalidate?: number | false;
  };
  queries?: Queries;
  params?: Params;
  body?: object | FormData | URLSearchParams;
};

export type ResponseContentType = "json" | "blob" | "text" | "undefined";

export type ApiClientSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  status: number;
};

export type ApiClientErrorResponse = {
  success: false;
  message: string;
  data: null;
  status: number;
};

export type ApiClientResponse<T> =
  | ApiClientSuccessResponse<T>
  | ApiClientErrorResponse;
