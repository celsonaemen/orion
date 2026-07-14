"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/features/app-shell/navigation";

import { SidebarItem } from "./sidebar-item";

type SidebarProps = {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
};

export function Sidebar({ isCollapsed, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden border-r border-[var(--orion-border)] bg-[var(--orion-sidebar)] transition-[width] duration-200 lg:flex ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex min-h-0 w-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-[var(--orion-border)] px-4">
          <div className={isCollapsed ? "sr-only" : ""}>
            <p className="text-base font-semibold text-[var(--orion-text)]">Orion</p>
            <p className="text-xs text-[var(--orion-muted)]">Core interno</p>
          </div>
          <button
            aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            onClick={onCollapseToggle}
            type="button"
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" size={17} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={17} />
            )}
          </button>
        </div>

        <nav aria-label="Navegacao principal" className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <SidebarItem item={item} isCollapsed={isCollapsed} pathname={pathname} />
                {!isCollapsed && item.children ? (
                  <ul className="mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <SidebarItem item={child} isChild pathname={pathname} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
