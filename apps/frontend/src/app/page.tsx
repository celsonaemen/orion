export default function HomePage() {
  return (
    <main className="min-h-screen bg-orion-surface px-6 py-10 text-orion-ink">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-orion-accent">
            Orion Chat — Fundação técnica
          </p>
          <h1 className="text-5xl font-semibold tracking-normal sm:text-6xl">Orion</h1>
          <p className="mt-5 text-xl text-orion-muted">
            Comunicação interna da contabilidade
          </p>
        </div>

        <div className="mt-12 w-full max-w-xl border border-orion-line bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-orion-accent" aria-hidden="true" />
            <span className="text-sm font-medium text-orion-ink">Frontend funcionando</span>
          </div>
          <p className="mt-3 text-sm text-orion-muted">
            Base Next.js criada para validação inicial do monorepo.
          </p>
        </div>
      </section>
    </main>
  );
}
