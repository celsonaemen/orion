"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getCurrentSession, logout, refreshSession } from "@/features/auth/client";
import type { AuthenticatedUser } from "@/types/auth";

import { AuthenticatedUserProvider } from "./authenticated-user-context";
import { Header } from "./header";
import { MobileNavigation } from "./mobile-navigation";
import { Sidebar } from "./sidebar";

type SessionState =
  | {
      status: "loading";
      user: null;
      message: string;
    }
  | {
      status: "authenticated";
      user: AuthenticatedUser;
      message: string;
    }
  | {
      status: "error";
      user: null;
      message: string;
    };

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({
    message: "Validando sessao...",
    status: "loading",
    user: null,
  });
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      const current = await getCurrentSession();

      if (!isActive) {
        return;
      }

      if (current.ok) {
        setSession({
          message: "",
          status: "authenticated",
          user: current.session.user,
        });
        return;
      }

      if (current.status === 401) {
        const refreshed = await refreshSession();

        if (!isActive) {
          return;
        }

        if (refreshed.ok) {
          setSession({
            message: "",
            status: "authenticated",
            user: refreshed.session.user,
          });
          return;
        }

        router.replace("/login?expired=1");
        return;
      }

      setSession({
        message: "Nao foi possivel carregar sua sessao.",
        status: "error",
        user: null,
      });
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (session.status === "loading") {
    return (
      <main className="flex min-h-screen items-center bg-[var(--orion-app-bg)] px-6 text-[var(--orion-text)]">
        <p className="mx-auto w-full max-w-6xl text-sm text-[var(--orion-muted)]">
          {session.message}
        </p>
      </main>
    );
  }

  if (session.status === "error") {
    return (
      <main className="flex min-h-screen items-center bg-[var(--orion-app-bg)] px-6 text-[var(--orion-text)]">
        <section className="mx-auto w-full max-w-lg border border-rose-300/40 bg-rose-500/10 p-6 text-sm text-rose-100">
          {session.message}
        </section>
      </main>
    );
  }

  const { user } = session;

  return (
    <AuthenticatedUserProvider user={user}>
      <div className="min-h-screen bg-[var(--orion-app-bg)] text-[var(--orion-text)]">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onCollapseToggle={() => {
            setIsSidebarCollapsed((current) => !current);
          }}
        />
        <MobileNavigation
          isOpen={isMobileNavigationOpen}
          onClose={() => {
            setIsMobileNavigationOpen(false);
          }}
        />
        <div
          className={`min-h-screen transition-[padding] duration-200 ${
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
          }`}
        >
          <Header
            isLoggingOut={isLoggingOut}
            onLogout={handleLogout}
            user={user}
            mobileMenuButton={
              <button
                aria-label="Abrir navegacao"
                className="inline-flex h-10 w-10 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)] lg:hidden"
                onClick={() => {
                  setIsMobileNavigationOpen(true);
                }}
                type="button"
              >
                <Menu aria-hidden="true" size={18} />
              </button>
            }
          />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </AuthenticatedUserProvider>
  );
}
