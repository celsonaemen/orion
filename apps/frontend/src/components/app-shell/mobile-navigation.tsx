"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/features/app-shell/navigation";

import { SidebarItem } from "./sidebar-item";

type MobileNavigationProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar navegacao"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-[min(22rem,88vw)] flex-col border-r border-[var(--orion-border)] bg-[var(--orion-sidebar)] shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-[var(--orion-border)] px-4">
          <div>
            <p className="text-base font-semibold text-[var(--orion-text)]">Orion</p>
            <p className="text-xs text-[var(--orion-muted)]">Core interno</p>
          </div>
          <button
            aria-label="Fechar navegacao"
            className="inline-flex h-10 w-10 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <nav aria-label="Navegacao principal" className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <SidebarItem item={item} onNavigate={onClose} pathname={pathname} />
                {item.children ? (
                  <ul className="mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <SidebarItem item={child} isChild onNavigate={onClose} pathname={pathname} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
