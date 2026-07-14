import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        description="Modulo futuro para administracao de usuarios internos."
        title="Usuarios"
      />
      <ComingSoon
        items={["Cadastro interno", "Cargos", "Permissoes explicitas"]}
        title="Usuarios"
      />
    </>
  );
}
