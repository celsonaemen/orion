import type { AuthenticatedUser } from "@/types/auth";

function hasPermission(user: Pick<AuthenticatedUser, "permissions">, permission: string) {
  return user.permissions.includes(permission);
}

export function canReadUsers(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "users.read");
}

export function canCreateUsers(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "users.create");
}

export function canUpdateUsers(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "users.update");
}

export function canChangeUserStatus(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "users.change-status");
}

export function canReadSectors(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "sectors.read");
}

export function canCreateSectors(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "sectors.create");
}

export function canUpdateSectors(user: Pick<AuthenticatedUser, "permissions">) {
  return hasPermission(user, "sectors.update");
}
