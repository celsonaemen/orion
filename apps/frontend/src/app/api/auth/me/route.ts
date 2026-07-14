import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getMeFromBackend } from "@/lib/auth/backend";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { refreshWithSingleFlight } from "@/lib/auth/refresh-session";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const currentUser = await getMeFromBackend(accessToken);

    if (currentUser.ok) {
      return NextResponse.json(currentUser.data);
    }

    if (currentUser.status !== 401) {
      return NextResponse.json({ message: "Nao foi possivel validar a sessao." }, { status: 503 });
    }
  }

  if (!refreshToken) {
    const response = NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await refreshWithSingleFlight(refreshToken);

  if (!refreshed.ok) {
    const response = NextResponse.json(
      { message: refreshed.status === 401 ? "Sessao expirada." : "Falha ao renovar sessao." },
      { status: refreshed.status === 401 ? 401 : 503 },
    );
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({
    user: refreshed.data.user,
  });
  setAuthCookies(response, refreshed.data.tokens);

  return response;
}
