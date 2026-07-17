import { randomUUID } from "node:crypto";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedDatabase } from "../prisma/seed";
import { AppModule } from "../src/app.module";
import { createPrismaClient } from "../src/database/prisma/prisma-client.factory";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const DEV_PASSWORD = "OrionDev123!";

function setTestSecret(name: string, value: string) {
  if (!process.env[name] || process.env[name]?.startsWith("replace_in")) {
    process.env[name] = value;
  }
}

setTestSecret("JWT_SECRET", "orion_test_access_secret_do_not_use");
setTestSecret("JWT_REFRESH_SECRET", "orion_test_refresh_secret_do_not_use");
process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ??= "900";
process.env.JWT_REFRESH_TOKEN_TTL_SECONDS ??= "604800";

describeWithDatabase("chat integration", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let auxiliarContabilToken: string;
  let auxiliarFiscalToken: string;
  let coordinatorToken: string;
  let adminUserId: string;
  let contabilSectorId: string;
  let fiscalSectorId: string;
  let fixtureChannelId: string;
  let paginationChannelId: string;
  const suiteId = randomUUID();
  const createdChannelIds: string[] = [];
  const createdMessageIds: string[] = [];
  const createdRefreshTokenIds = new Set<string>();
  const createdSessionIdentifiers = new Set<string>();
  const originalLastLoginByUserId = new Map<string, Date | null>();

  beforeAll(async () => {
    prisma = createPrismaClient();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();
    await seedDatabase(prisma);

    const fixtureUsers = await prisma.user.findMany({
      select: { id: true, lastLoginAt: true },
      where: {
        email: {
          in: [
            "admin@orion.local",
            "auxiliar.contabil@orion.local",
            "auxiliar.fiscal@orion.local",
            "coordenador.fiscal@orion.local",
          ],
        },
      },
    });

    for (const user of fixtureUsers) {
      originalLastLoginByUserId.set(user.id, user.lastLoginAt);
    }

    const [admin, fiscalSector, contabilSector] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: "admin@orion.local" } }),
      prisma.sector.findUniqueOrThrow({ where: { slug: "fiscal" } }),
      prisma.sector.findUniqueOrThrow({ where: { slug: "contabil" } }),
    ]);
    adminUserId = admin.id;
    fiscalSectorId = fiscalSector.id;
    contabilSectorId = contabilSector.id;

    const [fixtureChannel, paginationChannel] = await prisma.$transaction([
      prisma.channel.create({
        data: {
          createdById: admin.id,
          name: `Canal Chat ${suiteId}`,
          sectorId: fiscalSector.id,
          slug: `chat-fixture-${suiteId}`,
        },
      }),
      prisma.channel.create({
        data: {
          createdById: admin.id,
          name: `Paginacao Chat ${suiteId}`,
          sectorId: fiscalSector.id,
          slug: `chat-pagination-${suiteId}`,
        },
      }),
    ]);
    fixtureChannelId = fixtureChannel.id;
    paginationChannelId = paginationChannel.id;
    createdChannelIds.push(fixtureChannel.id, paginationChannel.id);

    adminToken = await loginAndGetToken("admin@orion.local");
    auxiliarContabilToken = await loginAndGetToken("auxiliar.contabil@orion.local");
    auxiliarFiscalToken = await loginAndGetToken("auxiliar.fiscal@orion.local");
    coordinatorToken = await loginAndGetToken("coordenador.fiscal@orion.local");
  });

  afterAll(async () => {
    await prisma.message.deleteMany({
      where: {
        OR: [{ id: { in: createdMessageIds } }, { channelId: { in: createdChannelIds } }],
      },
    });
    await prisma.auditLog.deleteMany({
      where: {
        resourceId: {
          in: [...createdChannelIds, ...createdSessionIdentifiers],
        },
      },
    });
    await prisma.channel.deleteMany({ where: { id: { in: createdChannelIds } } });
    await prisma.refreshToken.deleteMany({
      where: { id: { in: [...createdRefreshTokenIds] } },
    });
    await prisma.userSession.deleteMany({
      where: { sessionIdentifier: { in: [...createdSessionIdentifiers] } },
    });

    for (const [id, lastLoginAt] of originalLastLoginByUserId) {
      await prisma.user.update({ data: { lastLoginAt }, where: { id } });
    }

    await app?.close();
    await prisma?.$disconnect();
  });

  async function loginAndGetToken(email: string) {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: DEV_PASSWORD })
      .expect(201);

    if (response.body.user?.sessionId) {
      createdSessionIdentifiers.add(response.body.user.sessionId);
    }

    if (response.body.tokens?.refreshToken) {
      createdRefreshTokenIds.add(getRefreshTokenId(response.body.tokens.refreshToken));
    }

    return response.body.tokens.accessToken as string;
  }

  it("requires authentication and limits regular users to their sector", async () => {
    await request(app.getHttpServer()).get("/chat/channels").expect(401);

    const fiscalResponse = await request(app.getHttpServer())
      .get("/chat/channels")
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .expect(200);
    const adminResponse = await request(app.getHttpServer())
      .get("/chat/channels")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(fiscalResponse.body.sectors).toHaveLength(1);
    expect(fiscalResponse.body.sectors[0].slug).toBe("fiscal");
    expect(fiscalResponse.body.sectors[0].channels[0].slug).toBe("geral");
    expect(
      adminResponse.body.sectors.some((sector: { slug: string }) => sector.slug === "fiscal"),
    ).toBe(true);
    expect(
      adminResponse.body.sectors.some((sector: { slug: string }) => sector.slug === "contabil"),
    ).toBe(true);
  });

  it("enforces channel management permission and sector scope", async () => {
    await request(app.getHttpServer())
      .post("/chat/channels")
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .send({ name: "Sem permissao", sectorId: fiscalSectorId })
      .expect(403);

    const slug = `coordenacao-${suiteId}`;
    const created = await request(app.getHttpServer())
      .post("/chat/channels")
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .set("User-Agent", "orion-chat-test")
      .send({
        description: "Canal ficticio de integracao.",
        name: "Coordenacao Fiscal",
        sectorId: fiscalSectorId,
        slug,
      })
      .expect(201);
    createdChannelIds.push(created.body.channel.id);

    expect(created.body.channel.slug).toBe(slug);
    expect(created.body.channel.sector.slug).toBe("fiscal");

    await request(app.getHttpServer())
      .post("/chat/channels")
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .send({ name: "Slug duplicado", sectorId: fiscalSectorId, slug })
      .expect(409);

    await request(app.getHttpServer())
      .post("/chat/channels")
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .send({ name: "Outro setor", sectorId: contabilSectorId })
      .expect(404);

    const auditLog = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: "CHAT_CHANNEL_CREATED",
        resourceId: created.body.channel.id,
      },
    });
    expect(auditLog.actorUserId).not.toBeNull();
    expect(auditLog.metadata).toMatchObject({ sectorId: fiscalSectorId, slug });
    expect(JSON.stringify(auditLog.metadata)).not.toContain("content");
  });

  it("creates, lists and protects messages by channel sector", async () => {
    const created = await request(app.getHttpServer())
      .post(`/chat/channels/${fixtureChannelId}/messages`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .send({ content: "  Mensagem de integracao  " })
      .expect(201);
    createdMessageIds.push(created.body.message.id);

    expect(created.body.message.content).toBe("Mensagem de integracao");
    expect(created.body.message.author.name).toBe("Auxiliar Fiscal");

    const listed = await request(app.getHttpServer())
      .get(`/chat/channels/${fixtureChannelId}/messages?limit=50`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .expect(200);
    expect(
      listed.body.messages.some(
        (item: { id: string; content: string }) =>
          item.id === created.body.message.id && item.content === "Mensagem de integracao",
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/chat/channels/${fixtureChannelId}/messages`)
      .set("Authorization", `Bearer ${auxiliarContabilToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/chat/channels/${fixtureChannelId}/messages`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .send({ content: "   " })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/chat/channels/${fixtureChannelId}/messages`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .send({ content: "x".repeat(4001) })
      .expect(400);
  });

  it("paginates older messages with a validated cursor", async () => {
    const baseTime = Date.now() - 30_000;
    const createdMessages = await prisma.$transaction(
      [0, 1, 2].map((index) =>
        prisma.message.create({
          data: {
            authorId: adminUserId,
            channelId: paginationChannelId,
            content: `Mensagem ${index + 1}`,
            createdAt: new Date(baseTime + index * 1_000),
          },
        }),
      ),
    );
    createdMessageIds.push(...createdMessages.map((message) => message.id));

    const firstPage = await request(app.getHttpServer())
      .get(`/chat/channels/${paginationChannelId}/messages?limit=2`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .expect(200);
    expect(firstPage.body.messages.map((message: { content: string }) => message.content)).toEqual([
      "Mensagem 2",
      "Mensagem 3",
    ]);
    expect(firstPage.body.nextCursor).toEqual(expect.any(String));

    const secondPage = await request(app.getHttpServer())
      .get(
        `/chat/channels/${paginationChannelId}/messages?limit=2&cursor=${encodeURIComponent(firstPage.body.nextCursor)}`,
      )
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .expect(200);
    expect(secondPage.body.messages.map((message: { content: string }) => message.content)).toEqual(
      ["Mensagem 1"],
    );
    expect(secondPage.body.nextCursor).toBeNull();

    await request(app.getHttpServer())
      .get(`/chat/channels/${paginationChannelId}/messages?cursor=invalid-cursor`)
      .set("Authorization", `Bearer ${auxiliarFiscalToken}`)
      .expect(400);
  });
});

function getRefreshTokenId(refreshToken: string) {
  const payload = refreshToken.split(".")[1];

  if (!payload) {
    throw new Error("Refresh token payload is missing.");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    tokenId?: unknown;
  };

  if (typeof decoded.tokenId !== "string") {
    throw new Error("Refresh token identifier is missing.");
  }

  return decoded.tokenId;
}
