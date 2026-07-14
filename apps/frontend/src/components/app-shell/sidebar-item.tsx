"use client";

import Link from "next/link";

import type { NavigationItem } from "@/features/app-shell/navigation";
import { isNavigationItemActive } from "@/features/app-shell/navigation";

type SidebarItemProps = {
  item: NavigationItem;
  pathname: string;
  isCollapsed?: boolean;
  isChild?: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  isChild = false,
  isCollapsed = false,
  item,
  onNavigate,
  pathname,
}: SidebarItemProps) {
  const Icon = item.icon;
  const isActive = isNavigationItemActive(item, pathname);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[var(--orion-focus)] ${
        isActive
          ? "border-[var(--orion-accent)] bg-[var(--orion-active)] text-[var(--orion-text)]"
          : "border-transparent text-[var(--orion-muted)] hover:border-[var(--orion-border)] hover:bg-[var(--orion-hover)] hover:text-[var(--orion-text)]"
      } ${isChild ? "ml-7" : ""} ${isCollapsed ? "justify-center" : ""}`}
      href={item.href}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon aria-hidden="true" className="shrink-0" size={18} />
      {isCollapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
      {!isCollapsed && item.soon ? (
        <span className="ml-auto border border-[var(--orion-border)] px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--orion-accent)]">
          Em breve
        </span>
      ) : null}
    </Link>
  );
}
