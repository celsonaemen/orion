import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function SectorsPage() {
  return (
    <>
      <PageHeader
        description="Modulo futuro para estruturar setores e responsabilidades."
        title="Setores"
      />
      <ComingSoon
        items={["Setores operacionais", "Responsaveis", "Visao por equipe"]}
        title="Setores"
      />
    </>
  );
}
