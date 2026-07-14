"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { findNavigationItem } from "@/features/app-shell/navigation";
import { getUserSectorName } from "@/features/app-shell/user-display";
import type { AuthenticatedUser } from "@/types/auth";

import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

type HeaderProps = {
  isLoggingOut: boolean;
  mobileMenuButton: ReactNode;
  onLogout: () => void;
  user: AuthenticatedUser;
};

export function Header({ isLoggingOut, mobileMenuButton, onLogout, user }: HeaderProps) {
  const pathname = usePathname();
  const currentItem = findNavigationItem(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--orion-border)] bg-[var(--orion-header)]/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {mobileMenuButton}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--orion-text)]">
              {currentItem?.label ?? "Orion"}
            </p>
            <p className="hidden truncate text-xs text-[var(--orion-muted)] sm:block">
              {user.role.name} - {getUserSectorName(user)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Notificacoes indisponiveis nesta fase"
            className="inline-flex h-10 w-10 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            type="button"
            title="Notificacoes"
          >
            <Bell aria-hidden="true" size={18} />
          </button>
          <ThemeToggle />
          <UserMenu isLoggingOut={isLoggingOut} onLogout={onLogout} user={user} />
        </div>
      </div>
    </header>
  );
}
