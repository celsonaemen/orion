import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        description="Central futura para avisos internos e eventos importantes."
        title="Notificacoes"
      />
      <ComingSoon
        items={["Avisos internos", "Alertas por modulo", "Preferencias"]}
        title="Notificacoes"
      />
    </>
  );
}
