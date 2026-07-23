import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { refreshWithSingleFlight } from "@/lib/auth/refresh-session";
import { getBackendBaseUrl } from "@/lib/config/backend-url";

type ProxyMethod = "GET" | "POST" | "PATCH";

type ProxyOptions = {
  body?: unknown;
  method: ProxyMethod;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestBackend(path: string, accessToken: string, options: ProxyOptions) {
  return fetch(`${getBackendBaseUrl()}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    method: options.method,
  });
}

function safeErrorMessage(status: number) {
  if (status === 400) {
    return "Revise os dados informados.";
  }

  if (status === 401) {
    return "Sessao expirada.";
  }

  if (status === 403) {
    return "Voce nao tem permissao para esta acao.";
  }

  if (status === 404) {
    return "Registro nao encontrado.";
  }

  if (status === 409) {
    return "Ja existe um registro com esses dados.";
  }

  return "Nao foi possivel concluir a operacao agora.";
}

async function responseFromBackend(response: Response) {
  const body = await readJson(response);

  if (response.ok) {
    return NextResponse.json(body ?? {}, { status: response.status });
  }

  const status = [400, 401, 403, 404, 409, 415].includes(response.status) ? response.status : 503;

  return NextResponse.json({ message: safeErrorMessage(status) }, { status });
}

export async function proxyAuthenticatedBackend(
  _request: NextRequest,
  path: string,
  options: ProxyOptions,
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    const response = NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  if (accessToken) {
    try {
      const backendResponse = await requestBackend(path, accessToken, options);

      if (backendResponse.status !== 401) {
        return responseFromBackend(backendResponse);
      }
    } catch {
      return NextResponse.json({ message: "Backend indisponivel." }, { status: 503 });
    }
  }

  if (!refreshToken) {
    const response = NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await refreshWithSingleFlight(refreshToken);

  if (!refreshed.ok) {
    if (refreshed.code !== "invalid_session") {
      return NextResponse.json({ message: "Backend indisponivel." }, { status: 503 });
    }

    const response = NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    const backendResponse = await requestBackend(path, refreshed.data.tokens.accessToken, options);
    const response = await responseFromBackend(backendResponse);

    if (backendResponse.status === 401) {
      clearAuthCookies(response);
      return response;
    }

    setAuthCookies(response, refreshed.data.tokens);
    return response;
  } catch {
    const response = NextResponse.json({ message: "Backend indisponivel." }, { status: 503 });
    setAuthCookies(response, refreshed.data.tokens);
    return response;
  }
}
