import type { AuthenticatedUser } from "@/types/auth";

export function getUserInitials(user: Pick<AuthenticatedUser, "name" | "email">) {
  const source = user.name.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const [firstPart = "", secondPart = ""] = parts;
    return `${firstPart[0] ?? ""}${secondPart[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function getUserSectorName(user: Pick<AuthenticatedUser, "sector">) {
  return user.sector?.name ?? "Sem setor";
}
