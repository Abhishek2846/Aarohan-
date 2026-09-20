import { toast } from "@/hooks/use-toast";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
  idempotencyKey?: string;
}

export interface ApiEnvelope<T = unknown> {
  status?: string;
  statusCode?: number;
  message?: string;
  count?: number;
  data?: T;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const ACCESS_TOKEN_KEY = "bhoomi_token";
const REFRESH_TOKEN_KEY = "bhoomi_refresh_token";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  // Keep the fallback pointed at NestJS so a missing .env.local cannot
  // silently route requests to the old in-memory Next.js mock handlers.
  return trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1");
}

function getStoredToken(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function buildUrl(endpoint: string, params?: RequestOptions["params"]) {
  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Accept both "/projects" and "/v1/projects" without duplicating /v1.
  if (baseUrl.endsWith("/v1") && cleanEndpoint.startsWith("/v1/")) {
    cleanEndpoint = cleanEndpoint.slice(3);
  }

  const url = new URL(`${baseUrl}${cleanEndpoint}`, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: response.statusText || "The API returned an empty response." };
  }
}

async function refreshAccessToken() {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken || typeof window === "undefined") return null;

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: "include",
  });

  if (!response.ok) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    return null;
  }

  const payload = await readJson(response);
  const accessToken = payload?.data?.access_token || payload?.access_token;
  if (!accessToken) return null;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  document.cookie = `bhoomi_token=${encodeURIComponent(accessToken)}; path=/; max-age=28800; SameSite=Lax`;
  return accessToken as string;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, skipAuthRefresh, body, ...restOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!requestHeaders.has("Accept")) requestHeaders.set("Accept", "application/json");
  if (!requestHeaders.has("Bypass-Tunnel-Reminder")) requestHeaders.set("Bypass-Tunnel-Reminder", "true");
  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getStoredToken(ACCESS_TOKEN_KEY) || getStoredToken("bhoomi_auth_token");
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (options.idempotencyKey && !requestHeaders.has("Idempotency-Key")) {
    requestHeaders.set("Idempotency-Key", options.idempotencyKey);
  }

  const requestInit: RequestInit = {
    ...restOptions,
    body,
    signal: controller.signal,
    headers: requestHeaders,
    credentials: "include",
  };

  try {
    let response = await fetch(buildUrl(endpoint, params), requestInit);

    if (response.status === 401 && !skipAuthRefresh && !endpoint.includes("/auth/refresh")) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        requestHeaders.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(buildUrl(endpoint, params), requestInit);
      }
    }

    const isReplayed = response.headers.get("x-idempotent-replayed") === "true";
    const idempotencyKey = response.headers.get("x-idempotency-key");
    if (isReplayed) {
      try {
        toast.idempotent(
          "Statutory Mutation Replayed",
          `Safely retrieved from ledger without duplicate transaction (Key: ${idempotencyKey ? idempotencyKey.slice(0, 16) + "..." : "cached"})`
        );
      } catch {
        // Non-browser or SSR fallback
      }
    }

    const payload = await readJson(response);
    if (!response.ok) {
      const errMsg = payload?.message || `API error ${response.status}`;
      if (response.status === 403 && String(errMsg).toLowerCase().includes("jurisdiction")) {
        try {
          toast.jurisdiction(errMsg);
        } catch {}
      } else if (response.status === 429) {
        try {
          toast.warning("Rate Limit Exceeded", "Too many requests. Please wait 60 seconds before retrying.");
        } catch {}
      }
      throw new ApiError(errMsg, response.status, payload);
    }

    return payload as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Network request timed out", 408);
    }
    throw new ApiError(error instanceof Error ? error.message : "Network connection failure", 0, error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function unwrapApiData<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiEnvelope<T>).data as T;
  }
  return response as T;
}
