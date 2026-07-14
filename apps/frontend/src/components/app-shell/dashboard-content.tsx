"use client";

import { useAuthenticatedUser } from "./authenticated-user-context";
import { DashboardCard } from "./dashboard-card";
import { PageHeader } from "./page-header";

export function DashboardContent() {
  const user = useAuthenticatedUser();

  return (
    <>
      <PageHeader
        description="Visao inicial autenticada do Orion Core. Os modulos operacionais ainda estao em construcao."
        title="Dashboard"
      />

      <section className="mb-6 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--orion-accent)]">
          Bem-vindo ao Orion
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--orion-text)]">{user.name}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--orion-muted)]">
          Voce esta acessando a fundacao autenticada do Orion. O dashboard confirma sessao,
          usuario, cargo e setor; chat, empresas, notificacoes e administracao entram nas fases
          seguintes.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do dashboard">
        <DashboardCard label="Usuario logado" value={user.name} description={user.email} />
        <DashboardCard
          label="Setor"
          value={user.sector?.name ?? "Sem setor"}
          description="Vinculo retornado pela sessao autenticada."
        />
        <DashboardCard
          label="Cargo"
          value={user.role.name}
          description="Permissoes completas serao aplicadas nos modulos futuros."
        />
        <DashboardCard
          label="Status do sistema"
          value="Operacional"
          description="Backend e PostgreSQL validados pelo health check local."
        />
        <DashboardCard label="Empresas" value="Em breve" description="CRUD nao implementado." />
        <DashboardCard label="Mensagens" value="Em breve" description="Chat real nao implementado." />
        <DashboardCard
          label="Notificacoes"
          value="Em breve"
          description="Central de avisos ainda nao implementada."
        />
        <DashboardCard
          label="Administracao"
          value="-"
          description="Configuracoes administrativas serao adicionadas em fase futura."
        />
      </section>
    </>
  );
}
