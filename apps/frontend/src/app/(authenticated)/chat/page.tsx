import { PageHeader } from "@/components/app-shell/page-header";
import { PrivateChatWorkspace } from "@/features/chat/private-chat-workspace";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        description="Converse em tempo real com qualquer colaborador autenticado."
        title="Comunicacao"
      />
      <PrivateChatWorkspace />
    </>
  );
}
