import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--orion-app-bg)] px-6 text-[var(--orion-text)]">
      <section className="w-full max-w-md border border-[var(--orion-border)] bg-[var(--orion-panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--orion-accent)]">
          Orion
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Pagina nao encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--orion-muted)]">
          A rota solicitada nao existe ou ainda nao foi disponibilizada nesta fase.
        </p>
        <Link
          className="mt-6 inline-flex border border-[var(--orion-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--orion-text)] outline-none transition hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)]"
          href="/dashboard"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}
