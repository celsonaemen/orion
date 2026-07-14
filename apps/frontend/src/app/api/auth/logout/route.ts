import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { logoutWithBackend } from "@/lib/auth/backend";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { refreshWithSingleFlight } from "@/lib/auth/refresh-session";
import { isSameOriginPost, unsafeRequestResponse } from "@/lib/auth/request-safety";

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  let logoutStatus = 200;
  let refreshedTokens: Awaited<ReturnType<typeof refreshWithSingleFlight>> | null = null;

  if (accessToken) {
    const result = await logoutWithBackend(accessToken, refreshToken);
    logoutStatus = result.ok || result.status === 401 ? 200 : 503;
  } else if (refreshToken) {
    const refreshed = await refreshWithSingleFlight(refreshToken);
    refreshedTokens = refreshed;

    if (refreshed.ok) {
      const result = await logoutWithBackend(
        refreshed.data.tokens.accessToken,
        refreshed.data.tokens.refreshToken,
      );
      logoutStatus = result.ok || result.status === 401 ? 200 : 503;
    } else if (refreshed.code !== "invalid_session") {
      logoutStatus = 503;
    }
  }

  const response = NextResponse.json(
    { status: logoutStatus === 200 ? "ok" : "backend_unavailable" },
    { status: logoutStatus },
  );

  if (logoutStatus === 200) {
    clearAuthCookies(response);
  } else if (refreshedTokens?.ok) {
    setAuthCookies(response, refreshedTokens.data.tokens);
  }

  return response;
}
