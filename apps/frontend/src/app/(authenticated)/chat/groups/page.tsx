import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function GroupsPage() {
  return (
    <>
      <PageHeader
        description="Espaco reservado para grupos por setor, equipe ou rotina."
        title="Grupos"
      />
      <ComingSoon items={["Grupos por setor", "Permissoes por grupo", "Auditoria"]} title="Grupos" />
    </>
  );
}
