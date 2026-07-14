"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

import { getUserInitials, getUserSectorName } from "@/features/app-shell/user-display";
import type { AuthenticatedUser } from "@/types/auth";

type UserMenuProps = {
  isLoggingOut: boolean;
  onLogout: () => void;
  user: AuthenticatedUser;
};

export function UserMenu({ isLoggingOut, onLogout, user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initials = getUserInitials(user);

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex max-w-[15rem] items-center gap-3 border border-[var(--orion-border)] px-2 py-1.5 text-left outline-none transition hover:border-[var(--orion-border-strong)] focus:ring-2 focus:ring-[var(--orion-focus)]"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--orion-avatar)] text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-[var(--orion-text)]">
            {user.name}
          </span>
          <span className="block truncate text-xs text-[var(--orion-muted)]">
            {user.role.name} - {getUserSectorName(user)}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="hidden text-[var(--orion-muted)] sm:block" size={16} />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-40 mt-2 w-72 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-2 shadow-lg"
          role="menu"
        >
          <div className="border-b border-[var(--orion-border)] px-3 py-3">
            <p className="truncate text-sm font-semibold text-[var(--orion-text)]">{user.name}</p>
            <p className="mt-1 truncate text-xs text-[var(--orion-muted)]">{user.email}</p>
            <p className="mt-2 text-xs text-[var(--orion-muted)]">
              {user.role.name} - {getUserSectorName(user)}
            </p>
          </div>
          <button
            className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-[var(--orion-text)] outline-none transition hover:bg-[var(--orion-hover)] focus:ring-2 focus:ring-[var(--orion-focus)] disabled:cursor-not-allowed disabled:text-[var(--orion-muted)]"
            disabled={isLoggingOut}
            onClick={onLogout}
            role="menuitem"
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
