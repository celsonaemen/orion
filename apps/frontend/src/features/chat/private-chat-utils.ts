import type { PrivateChatMessage, PrivateConversation } from "./types";

export function mergePrivateMessages(
  current: PrivateChatMessage[],
  incoming: PrivateChatMessage[],
) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);

  return [...byId.values()].sort((first, second) => {
    const timeDifference = Date.parse(first.createdAt) - Date.parse(second.createdAt);
    return timeDifference || first.id.localeCompare(second.id);
  });
}

export function mergePrivateConversation(
  conversations: PrivateConversation[],
  incoming: PrivateConversation,
) {
  return [incoming, ...conversations.filter((item) => item.id !== incoming.id)].sort(
    (first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
  );
}

export function privateConversationLabel(conversation: PrivateConversation) {
  if (conversation.type === "DIRECT") {
    return conversation.otherParticipant?.name ?? "Conversa privada";
  }

  return conversation.title ?? "Grupo";
}

export function chatRealtimeUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return `${baseUrl.replace(/\/+$/, "")}/chat`;
}
