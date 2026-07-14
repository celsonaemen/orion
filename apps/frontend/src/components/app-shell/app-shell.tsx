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
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      try {
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

          if (refreshed.status === 401) {
            router.replace("/login?expired=1");
            return;
          }

          setSession({
            message: "Nao foi possivel renovar sua sessao agora.",
            status: "error",
            user: null,
          });
          return;
        }

        setSession({
          message: "Nao foi possivel carregar sua sessao.",
          status: "error",
          user: null,
        });
      } catch {
        if (isActive) {
          setSession({
            message: "Nao foi possivel carregar sua sessao.",
            status: "error",
            user: null,
          });
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    const result = await logout();

    if (result.ok) {
      router.replace("/login");
      router.refresh();
      return;
    }

    setLogoutError("Nao foi possivel encerrar sua sessao agora.");
    setIsLoggingOut(false);
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
        <section className="mx-auto w-full max-w-lg border border-rose-300/40 bg-rose-500/10 p-6 text-sm text-[var(--orion-danger)]">
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
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {logoutError ? (
              <p
                className="mb-4 border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
                role="alert"
              >
                {logoutError}
              </p>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </AuthenticatedUserProvider>
  );
}
