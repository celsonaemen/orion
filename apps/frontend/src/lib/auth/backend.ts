import type { BackendAuthResponse, SessionResponse } from "@/types/auth";

import { isBackendAuthResponse, isBackendMeResponse } from "./response-guards";

export type BackendAuthErrorCode =
  | "invalid_credentials"
  | "invalid_session"
  | "backend_unavailable"
  | "unexpected_response";

export type BackendAuthResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      code: BackendAuthErrorCode;
      status: number;
    };

type LoginPayload = {
  email: string;
  password: string;
};

function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestBackend<T>(
  path: string,
  init: RequestInit,
  isValid: (value: unknown) => value is T,
): Promise<BackendAuthResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    return {
      code: "backend_unavailable",
      ok: false,
      status: 503,
    };
  }

  if (!response.ok) {
    return {
      code: response.status === 401 ? "invalid_session" : "backend_unavailable",
      ok: false,
      status: response.status,
    };
  }

  const body = await readJson(response);

  if (!isValid(body)) {
    return {
      code: "unexpected_response",
      ok: false,
      status: 502,
    };
  }

  return {
    data: body,
    ok: true,
  };
}

export function loginWithBackend(payload: LoginPayload) {
  return requestBackend<BackendAuthResponse>(
    "/auth/login",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
    isBackendAuthResponse,
  );
}

export function refreshWithBackend(refreshToken: string) {
  return requestBackend<BackendAuthResponse>(
    "/auth/refresh",
    {
      body: JSON.stringify({ refreshToken }),
      method: "POST",
    },
    isBackendAuthResponse,
  );
}

export function getMeFromBackend(accessToken: string) {
  return requestBackend<SessionResponse>(
    "/auth/me",
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    },
    isBackendMeResponse,
  );
}

export function logoutWithBackend(accessToken: string, refreshToken?: string) {
  return requestBackend<{ status: "ok" }>(
    "/auth/logout",
    {
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      method: "POST",
    },
    (value): value is { status: "ok" } =>
      typeof value === "object" &&
      value !== null &&
      "status" in value &&
      value.status === "ok",
  );
}
