import assert from "node:assert/strict";
import test from "node:test";

import { chatApiRequest } from "./api.ts";
import {
  buildMessagesQuery,
  canManageChatChannels,
  mergeMessages,
  normalizeChannelSlug,
  selectDefaultChannelId,
  shouldApplyMessageResponse,
  toCreateChannelPayload,
  validateCreateChannelForm,
} from "./chat-utils.ts";
import type { ChatMessage, ChatSector } from "./types.ts";

const sectors: ChatSector[] = [
  {
    channels: [
      {
        createdAt: "2026-07-16T12:00:00.000Z",
        description: null,
        id: "channel-fiscal",
        isActive: true,
        name: "Geral",
        slug: "geral",
        updatedAt: "2026-07-16T12:00:00.000Z",
      },
    ],
    id: "sector-fiscal",
    name: "Fiscal",
    slug: "fiscal",
  },
];

function message(id: string, createdAt: string, content = id): ChatMessage {
  return {
    author: { id: "author-1", name: "Usuario Teste" },
    channelId: "channel-fiscal",
    content,
    createdAt,
    id,
  };
}

test("chat permission helper exposes channel management only when granted", () => {
  assert.equal(canManageChatChannels({ permissions: ["chat.channels.manage"] }), true);
  assert.equal(canManageChatChannels({ permissions: ["chat.access"] }), false);
});

test("channel form normalizes values and builds a safe payload", () => {
  const values = {
    description: "  Avisos do setor  ",
    name: "  Obrigações Fiscais  ",
    sectorId: "sector-fiscal",
    slug: "",
  };
  const result = validateCreateChannelForm(values);

  assert.equal(result.isValid, true);
  assert.equal(result.values.slug, "obrigacoes-fiscais");
  assert.deepEqual(toCreateChannelPayload(values), {
    description: "Avisos do setor",
    name: "Obrigações Fiscais",
    sectorId: "sector-fiscal",
    slug: "obrigacoes-fiscais",
  });
});

test("channel form rejects invalid required fields and oversized descriptions", () => {
  const result = validateCreateChannelForm({
    description: "x".repeat(241),
    name: "A",
    sectorId: "",
    slug: "slug invalido",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.sectorId, "Selecione um setor.");
  assert.equal(result.errors.name, "Use entre 2 e 120 caracteres.");
  assert.equal(result.values.slug, "slug-invalido");
  assert.equal(result.errors.slug, undefined);
  assert.equal(result.errors.description, "Use no maximo 240 caracteres.");
});

test("message helpers select the general channel and preserve chronological order", () => {
  const older = message("message-1", "2026-07-16T12:00:00.000Z");
  const newer = message("message-2", "2026-07-16T12:01:00.000Z");
  const updatedNewer = message("message-2", "2026-07-16T12:01:00.000Z", "atualizada");

  assert.equal(selectDefaultChannelId(sectors), "channel-fiscal");
  assert.deepEqual(mergeMessages([newer], [older, updatedNewer]), [older, updatedNewer]);
  assert.equal(buildMessagesQuery("cursor-value", 25), "limit=25&cursor=cursor-value");
});

test("stale message responses are rejected after a channel change", () => {
  assert.equal(shouldApplyMessageResponse(4, 4, "channel-fiscal", "channel-fiscal"), true);
  assert.equal(shouldApplyMessageResponse(3, 4, "channel-fiscal", "channel-fiscal"), false);
  assert.equal(shouldApplyMessageResponse(4, 4, "channel-fiscal", "channel-contabil"), false);
});

test("slug normalization removes accents and unsafe separators", () => {
  assert.equal(normalizeChannelSlug("  Obrigações / 2026  "), "obrigacoes-2026");
});

test("chatApiRequest converts network failures into a controlled result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;

  try {
    const result = await chatApiRequest("/api/chat/channels");

    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
