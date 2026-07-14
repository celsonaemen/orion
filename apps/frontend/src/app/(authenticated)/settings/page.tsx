import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Preferencias do ambiente Orion e configuracoes futuras."
        title="Configuracoes"
      />
      <ComingSoon
        items={["Preferencias da conta", "Tema", "Configuracoes do workspace"]}
        title="Configuracoes"
      />
    </>
  );
}
