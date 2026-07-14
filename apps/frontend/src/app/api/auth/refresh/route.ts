import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { refreshWithSingleFlight } from "@/lib/auth/refresh-session";
import { isSameOriginPost, unsafeRequestResponse } from "@/lib/auth/request-safety";

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.json({ message: "Sessao expirada." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const result = await refreshWithSingleFlight(refreshToken);

  if (!result.ok) {
    const isInvalidSession = result.code === "invalid_session";
    const response = NextResponse.json(
      { message: isInvalidSession ? "Sessao expirada." : "Falha ao renovar sessao." },
      { status: isInvalidSession ? 401 : 503 },
    );

    if (isInvalidSession) {
      clearAuthCookies(response);
    }

    return response;
  }

  const response = NextResponse.json({
    user: result.data.user,
  });
  setAuthCookies(response, result.data.tokens);

  return response;
}
