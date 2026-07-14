import { NextRequest, NextResponse } from "next/server";

import { protectedRoutes } from "./features/app-shell/routes";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./lib/auth/cookie-names";

function hasSessionCookie(request: NextRequest) {
  return request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE);
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = hasSessionCookie(request);
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession && !searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/chat/:path*",
    "/companies/:path*",
    "/users/:path*",
    "/sectors/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
