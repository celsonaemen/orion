import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function PrivateMessagesPage() {
  return (
    <>
      <PageHeader
        description="Area reservada para mensagens privadas autorizadas."
        title="Mensagens privadas"
      />
      <ComingSoon
        items={["Conversas individuais", "Status de leitura", "Notificacoes"]}
        title="Mensagens privadas"
      />
    </>
  );
}
