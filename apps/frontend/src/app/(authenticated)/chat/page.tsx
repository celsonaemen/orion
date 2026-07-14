import { ComingSoon } from "@/components/app-shell/coming-soon";
import { PageHeader } from "@/components/app-shell/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        description="Central de comunicacao interna preparada para conversas futuras."
        title="Chat"
      />
      <ComingSoon
        items={["Mensagens em tempo real", "Historico de conversas", "Presenca online"]}
        title="Comunicacao em construcao"
      />
    </>
  );
}
