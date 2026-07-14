"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, logout, refreshSession } from "@/features/auth/client";
import type { AuthenticatedUser } from "@/types/auth";

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

export function DashboardShell() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({
    message: "Validando sessao...",
    status: "loading",
    user: null,
  });
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
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
          <p className="text-sm text-slate-300">{session.message}</p>
        </div>
      </main>
    );
  }

  if (session.status === "error") {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
          <div className="border border-rose-300/30 bg-rose-300/10 p-6 text-rose-100">
            {session.message}
          </div>
        </div>
      </main>
    );
  }

  const { user } = session;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
              Orion Core
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-4xl">
              Dashboard
            </h1>
          </div>
          <button
            className="w-full border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition hover:border-teal-300 hover:text-teal-200 focus:ring-2 focus:ring-teal-200 md:w-auto"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Usuario autenticado</h2>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Nome
                </dt>
                <dd className="mt-1 text-base text-white">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  E-mail
                </dt>
                <dd className="mt-1 text-base text-white">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Cargo
                </dt>
                <dd className="mt-1 text-base text-white">{user.role.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Setor
                </dt>
                <dd className="mt-1 text-base text-white">{user.sector?.name ?? "Sem setor"}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Status do Orion</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              O Orion Core esta em construcao. Esta area confirma a autenticacao inicial,
              a sessao ativa e a integracao real com o backend.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
