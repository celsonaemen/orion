import type { NextResponse } from "next/server";

import type { AuthTokens } from "@/types/auth";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./cookie-names";

const DEFAULT_REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function isSecureCookieEnabled() {
  return process.env.NODE_ENV === "production";
}

function getRefreshTokenMaxAgeSeconds() {
  const value = Number(process.env.JWT_REFRESH_TOKEN_TTL_SECONDS);

  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  return DEFAULT_REFRESH_TOKEN_MAX_AGE_SECONDS;
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const secure = isSecureCookieEnabled();

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    maxAge: tokens.expiresIn,
    path: "/",
    sameSite: "lax",
    secure,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    maxAge: getRefreshTokenMaxAgeSeconds(),
    path: "/",
    sameSite: "lax",
    secure,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isSecureCookieEnabled(),
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isSecureCookieEnabled(),
  });
}
