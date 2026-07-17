import {
  Bell,
  Building2,
  Gauge,
  MessageSquare,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export { protectedRoutes } from "./routes.ts";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
  permission?: string;
  children?: NavigationItem[];
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    icon: Gauge,
    label: "Dashboard",
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Comunicacao",
  },
  {
    href: "/companies",
    icon: Building2,
    label: "Empresas",
    permission: "companies.read",
    soon: true,
  },
  {
    href: "/users",
    icon: Users,
    label: "Usuarios",
    permission: "users.read",
  },
  {
    href: "/sectors",
    icon: Workflow,
    label: "Setores",
    permission: "sectors.read",
  },
  {
    href: "/notifications",
    icon: Bell,
    label: "Notificacoes",
    soon: true,
  },
  {
    href: "/admin",
    icon: Shield,
    label: "Administracao",
    permission: "admin.access",
    soon: true,
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Configuracoes",
    soon: true,
  },
];

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  if (item.href === "/dashboard") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function flattenNavigationItems(
  items: NavigationItem[] = navigationItems,
): NavigationItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.children ? flattenNavigationItems(item.children) : []),
  ]);
}

export function findNavigationItem(pathname: string) {
  const candidates = flattenNavigationItems().filter((item) =>
    isNavigationItemActive(item, pathname),
  );

  return [...candidates].sort((first, second) => second.href.length - first.href.length)[0];
}
