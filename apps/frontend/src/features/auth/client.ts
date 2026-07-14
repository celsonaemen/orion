"use client";

import type { SessionResponse } from "@/types/auth";

import { createRefreshCoordinator } from "./refresh-coordinator";

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthClientResult =
  | {
      ok: true;
      session: SessionResponse;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

async function parseSessionResponse(response: Response): Promise<AuthClientResult> {
  if (!response.ok) {
    return {
      message:
        response.status === 401
          ? "E-mail ou senha invalidos."
          : "Nao foi possivel concluir a autenticacao agora.",
      ok: false,
      status: response.status,
    };
  }

  const body = (await response.json()) as Partial<SessionResponse>;

  if (!body.user) {
    return {
      message: "Resposta de autenticacao inesperada.",
      ok: false,
      status: 502,
    };
  }

  return {
    ok: true,
    session: {
      user: body.user,
    },
  };
}

export async function login(input: LoginInput) {
  const response = await fetch("/api/auth/login", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return parseSessionResponse(response);
}

export async function getCurrentSession() {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
  });

  return parseSessionResponse(response);
}

const refreshOnce = createRefreshCoordinator(async () => {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
  });

  return parseSessionResponse(response);
});

export function refreshSession() {
  return refreshOnce();
}

export async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}
