import type { AuthenticatedUser, BackendAuthResponse } from "@/types/auth";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRole(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.hierarchyLevel === "number"
  );
}

function isSector(value: unknown) {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.id === "string" &&
      typeof value.name === "string" &&
      typeof value.slug === "string")
  );
}

export function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.name === "string" &&
    typeof value.status === "string" &&
    typeof value.sessionId === "string" &&
    isRole(value.role) &&
    isSector(value.sector) &&
    isStringArray(value.permissions)
  );
}

export function isBackendAuthResponse(value: unknown): value is BackendAuthResponse {
  if (!isRecord(value) || !isRecord(value.tokens)) {
    return false;
  }

  return (
    typeof value.tokens.accessToken === "string" &&
    typeof value.tokens.refreshToken === "string" &&
    typeof value.tokens.expiresIn === "number" &&
    value.tokens.expiresIn > 0 &&
    value.tokens.tokenType === "Bearer" &&
    isAuthenticatedUser(value.user)
  );
}

export function isBackendMeResponse(
  value: unknown,
): value is { user: AuthenticatedUser } {
  return isRecord(value) && isAuthenticatedUser(value.user);
}
