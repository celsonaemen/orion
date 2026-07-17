import type { AuthenticatedUser } from "@/types/auth";

import type { ChatChannel, ChatMessage, ChatSector, CreateChannelFormValues } from "./types";

export const CHAT_MESSAGE_LIMIT = 50;

export function canManageChatChannels(user: Pick<AuthenticatedUser, "permissions">) {
  return user.permissions.includes("chat.channels.manage");
}

export function normalizeChannelSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateCreateChannelForm(values: CreateChannelFormValues) {
  const normalized = {
    description: values.description.trim(),
    name: values.name.trim(),
    sectorId: values.sectorId,
    slug: normalizeChannelSlug(values.slug || values.name),
  };
  const errors: Partial<Record<keyof CreateChannelFormValues, string>> = {};

  if (!normalized.sectorId) errors.sectorId = "Selecione um setor.";
  if (normalized.name.length < 2 || normalized.name.length > 120) {
    errors.name = "Use entre 2 e 120 caracteres.";
  }
  if (normalized.slug.length < 2 || normalized.slug.length > 80) {
    errors.slug = "Use um slug entre 2 e 80 caracteres.";
  }
  if (!/^[a-z0-9-]+$/.test(normalized.slug)) {
    errors.slug = "Use apenas letras minusculas, numeros e hifens.";
  }
  if (normalized.description.length > 240) {
    errors.description = "Use no maximo 240 caracteres.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: normalized,
  };
}

export function buildMessagesQuery(cursor?: string, limit = CHAT_MESSAGE_LIMIT) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set("cursor", cursor);
  return query.toString();
}

export function findChannel(sectors: ChatSector[], channelId: string | null) {
  if (!channelId) return null;

  for (const sector of sectors) {
    const channel = sector.channels.find((candidate) => candidate.id === channelId);
    if (channel) return { channel, sector };
  }

  return null;
}

export function selectDefaultChannelId(sectors: ChatSector[], currentChannelId?: string | null) {
  if (currentChannelId && findChannel(sectors, currentChannelId)) return currentChannelId;

  for (const sector of sectors) {
    const general = sector.channels.find((channel) => channel.slug === "geral");
    if (general) return general.id;
  }

  for (const sector of sectors) {
    if (sector.channels[0]) return sector.channels[0].id;
  }

  return null;
}

export function groupChannelsBySector(sectors: ChatSector[]) {
  return sectors.map((sector) => ({
    ...sector,
    channels: [...sector.channels].sort((first, second) => {
      if (first.slug === "geral") return -1;
      if (second.slug === "geral") return 1;
      return first.name.localeCompare(second.name, "pt-BR");
    }),
  }));
}

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const message of current) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);

  return [...byId.values()].sort((first, second) => {
    const timeDifference = Date.parse(first.createdAt) - Date.parse(second.createdAt);
    return timeDifference || first.id.localeCompare(second.id);
  });
}

export function shouldApplyMessageResponse(
  requestId: number,
  latestRequestId: number,
  requestedChannelId: string,
  activeChannelId: string | null,
) {
  return requestId === latestRequestId && requestedChannelId === activeChannelId;
}

export function toCreateChannelPayload(values: CreateChannelFormValues) {
  const validated = validateCreateChannelForm(values);
  return {
    description: validated.values.description || undefined,
    name: validated.values.name,
    sectorId: validated.values.sectorId,
    slug: validated.values.slug,
  };
}

export function channelLabel(channel: Pick<ChatChannel, "slug">) {
  return `#${channel.slug}`;
}
