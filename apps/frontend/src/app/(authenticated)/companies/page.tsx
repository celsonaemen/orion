import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        description="Modulo futuro para organizar empresas clientes e contexto operacional."
        title="Empresas"
      />
      <ComingSoon
        items={["Cadastro de empresas", "Vinculo por setor", "Contexto operacional"]}
        title="Empresas"
      />
    </>
  );
}
