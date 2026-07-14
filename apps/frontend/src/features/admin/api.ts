type ApiResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      message: string;
      ok: false;
      status: number;
    };

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    return {
      message: "Nao foi possivel conectar ao servidor.",
      ok: false,
      status: 503,
    };
  }

  const body = await readJson(response);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login?expired=1");
    }

    return {
      message:
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : "Nao foi possivel concluir a operacao.",
      ok: false,
      status: response.status,
    };
  }

  return {
    data: body as T,
    ok: true,
  };
}
