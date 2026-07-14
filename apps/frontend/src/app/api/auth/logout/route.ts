import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { logoutWithBackend } from "@/lib/auth/backend";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { clearAuthCookies } from "@/lib/auth/cookies";
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

  if (accessToken) {
    const result = await logoutWithBackend(accessToken, refreshToken);
    logoutStatus = result.ok || result.status === 401 ? 200 : 503;
  } else if (refreshToken) {
    const refreshed = await refreshWithSingleFlight(refreshToken);

    if (refreshed.ok) {
      const result = await logoutWithBackend(
        refreshed.data.tokens.accessToken,
        refreshed.data.tokens.refreshToken,
      );
      logoutStatus = result.ok || result.status === 401 ? 200 : 503;
    }
  }

  const response = NextResponse.json(
    { status: logoutStatus === 200 ? "ok" : "local_session_cleared" },
    { status: logoutStatus },
  );
  clearAuthCookies(response);

  return response;
}
