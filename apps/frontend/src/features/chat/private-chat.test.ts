import assert from "node:assert/strict";
import test from "node:test";

import {
  chatRealtimeUrl,
  mergePrivateConversation,
  mergePrivateMessages,
  privateConversationLabel,
} from "./private-chat-utils.ts";
import type { PrivateChatMessage, PrivateConversation } from "./types.ts";

const user = {
  email: "auxiliar.fiscal@orion.local",
  id: "user-fiscal",
  name: "Auxiliar Fiscal",
  sector: { id: "fiscal", name: "Fiscal" },
};

function message(id: string, createdAt: string): PrivateChatMessage {
  return {
    author: user,
    content: id,
    conversationId: "conversation-1",
    createdAt,
    id,
  };
}

function conversation(id: string, updatedAt: string): PrivateConversation {
  return {
    createdAt: updatedAt,
    id,
    lastMessage: null,
    lastMessageAt: null,
    otherParticipant: user,
    participants: [user],
    title: null,
    type: "DIRECT",
    updatedAt,
  };
}

test("private messages merge without duplicates in chronological order", () => {
  const first = message("first", "2026-07-16T12:00:00.000Z");
  const second = message("second", "2026-07-16T12:01:00.000Z");

  assert.deepEqual(mergePrivateMessages([second], [first, second]), [first, second]);
});

test("private conversations are merged and ordered by recent activity", () => {
  const older = conversation("older", "2026-07-16T12:00:00.000Z");
  const newer = conversation("newer", "2026-07-16T12:01:00.000Z");

  assert.deepEqual(mergePrivateConversation([older], newer), [newer, older]);
  assert.equal(privateConversationLabel(newer), "Auxiliar Fiscal");
});

test("realtime URL defaults to the browser origin and supports a public override", () => {
  assert.equal(chatRealtimeUrl(undefined, "https://orion.example.com"), "https://orion.example.com/chat");
  assert.equal(
    chatRealtimeUrl("https://realtime.example.com/", "https://orion.example.com"),
    "https://realtime.example.com/chat",
  );
});
