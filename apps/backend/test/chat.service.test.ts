import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../src/database/prisma/prisma.service";
import { ChatService } from "../src/modules/chat/chat.service";
import type { AuthenticatedUser } from "../src/modules/auth/types/authenticated-user";
import type { HttpRequest } from "../src/modules/auth/types/http-request";

const fiscalUser: AuthenticatedUser = {
  email: "auxiliar.fiscal@orion.local",
  id: "00000000-0000-4000-8000-000000000001",
  name: "Auxiliar Fiscal",
  permissions: ["chat.access"],
  role: {
    hierarchyLevel: 4,
    id: "00000000-0000-4000-8000-000000000002",
    name: "Auxiliar",
    slug: "auxiliar",
  },
  sector: {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Fiscal",
    slug: "fiscal",
  },
  sessionId: "session-chat-test",
  status: "ACTIVE",
};

function createPrismaDouble() {
  const channelFindFirst = vi.fn();
  const messageCreate = vi.fn();
  const messageFindMany = vi.fn();
  const sectorFindFirst = vi.fn();
  const sectorFindMany = vi.fn();
  const prisma = {
    channel: { findFirst: channelFindFirst },
    message: { create: messageCreate, findMany: messageFindMany },
    sector: { findFirst: sectorFindFirst, findMany: sectorFindMany },
  } as unknown as PrismaService;

  return {
    channelFindFirst,
    messageCreate,
    messageFindMany,
    prisma,
    sectorFindFirst,
    sectorFindMany,
  };
}

describe("ChatService", () => {
  it("limits channel listing to the authenticated user's active sector", async () => {
    const { prisma, sectorFindMany } = createPrismaDouble();
    sectorFindMany.mockResolvedValue([
      {
        channels: [
          { id: "channel-b", name: "Avisos", slug: "avisos" },
          { id: "channel-a", name: "Geral", slug: "geral" },
        ],
        id: fiscalUser.sector?.id,
        name: "Fiscal",
        slug: "fiscal",
      },
    ]);
    const service = new ChatService(prisma);

    const result = await service.listChannels(fiscalUser);

    expect(sectorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: fiscalUser.sector?.id,
          isActive: true,
        },
      }),
    );
    expect(result.sectors[0]?.channels.map((channel) => channel.slug)).toEqual(["geral", "avisos"]);
  });

  it("allows chat.read_all to list every active sector", async () => {
    const { prisma, sectorFindMany } = createPrismaDouble();
    sectorFindMany.mockResolvedValue([]);
    const service = new ChatService(prisma);

    await service.listChannels({
      ...fiscalUser,
      permissions: [...fiscalUser.permissions, "chat.read_all"],
    });

    expect(sectorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("combines the requested sector with the user's scope instead of replacing it", async () => {
    const { prisma, sectorFindFirst } = createPrismaDouble();
    sectorFindFirst.mockResolvedValue(null);
    const service = new ChatService(prisma);
    const requestedSectorId = "00000000-0000-4000-8000-000000000099";

    await expect(
      service.createChannel(
        { name: "Outro setor", sectorId: requestedSectorId },
        fiscalUser,
        {} as HttpRequest,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(sectorFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ id: requestedSectorId, isActive: true }, { id: fiscalUser.sector?.id }],
        },
      }),
    );
  });

  it("trims and stores a message only after channel access is confirmed", async () => {
    const { channelFindFirst, messageCreate, prisma } = createPrismaDouble();
    channelFindFirst.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000010" });
    messageCreate.mockResolvedValue({
      author: { id: fiscalUser.id, name: fiscalUser.name },
      channelId: "00000000-0000-4000-8000-000000000010",
      content: "Mensagem interna",
      createdAt: new Date("2026-07-16T12:00:00.000Z"),
      id: "00000000-0000-4000-8000-000000000011",
    });
    const service = new ChatService(prisma);

    const result = await service.createMessage(
      "00000000-0000-4000-8000-000000000010",
      { content: "  Mensagem interna  " },
      fiscalUser,
    );

    expect(channelFindFirst).toHaveBeenCalledOnce();
    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          authorId: fiscalUser.id,
          channelId: "00000000-0000-4000-8000-000000000010",
          content: "Mensagem interna",
        },
      }),
    );
    expect(result.message.content).toBe("Mensagem interna");
  });

  it("rejects inaccessible channels and malformed pagination cursors", async () => {
    const { channelFindFirst, messageFindMany, prisma } = createPrismaDouble();
    const service = new ChatService(prisma);
    channelFindFirst.mockResolvedValueOnce(null);

    await expect(
      service.createMessage(
        "00000000-0000-4000-8000-000000000010",
        { content: "Mensagem" },
        fiscalUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    channelFindFirst.mockResolvedValueOnce({ id: "00000000-0000-4000-8000-000000000010" });
    await expect(
      service.listMessages(
        "00000000-0000-4000-8000-000000000010",
        { cursor: "invalid-cursor", limit: 50 },
        fiscalUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(messageFindMany).not.toHaveBeenCalled();
  });
});
