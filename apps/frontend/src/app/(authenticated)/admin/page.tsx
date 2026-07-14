import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        description="Area reservada para administracao controlada e auditavel."
        title="Administracao"
      />
      <ComingSoon
        items={["Politicas de acesso", "Auditoria", "Configuracoes administrativas"]}
        title="Administracao"
      />
    </>
  );
}
