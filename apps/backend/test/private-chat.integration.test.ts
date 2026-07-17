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

describeWithDatabase("private chat integration", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let fiscalToken: string;
  let contabilToken: string;
  let adminId: string;
  let fiscalId: string;
  let conversationId: string;
  let conversationWasCreatedBySuite = false;
  const createdMessageIds: string[] = [];
  const createdRefreshTokenIds = new Set<string>();
  const createdSessionIdentifiers = new Set<string>();
  const originalLastLoginByUserId = new Map<string, Date | null>();

  beforeAll(async () => {
    prisma = createPrismaClient();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }),
    );
    await app.init();
    await seedDatabase(prisma);

    const users = await prisma.user.findMany({
      select: { email: true, id: true, lastLoginAt: true },
      where: {
        email: {
          in: ["admin@orion.local", "auxiliar.fiscal@orion.local", "auxiliar.contabil@orion.local"],
        },
      },
    });
    for (const user of users) originalLastLoginByUserId.set(user.id, user.lastLoginAt);

    adminId = users.find((user) => user.email === "admin@orion.local")!.id;
    fiscalId = users.find((user) => user.email === "auxiliar.fiscal@orion.local")!.id;
    adminToken = await login("admin@orion.local");
    fiscalToken = await login("auxiliar.fiscal@orion.local");
    contabilToken = await login("auxiliar.contabil@orion.local");
  });

  afterAll(async () => {
    await prisma.conversationMessage.deleteMany({ where: { id: { in: createdMessageIds } } });
    if (conversationWasCreatedBySuite && conversationId) {
      await prisma.conversation.deleteMany({ where: { id: conversationId } });
    }
    await prisma.auditLog.deleteMany({
      where: { resourceId: { in: [...createdSessionIdentifiers] } },
    });
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

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: DEV_PASSWORD })
      .expect(201);
    createdSessionIdentifiers.add(response.body.user.sessionId);
    createdRefreshTokenIds.add(getRefreshTokenId(response.body.tokens.refreshToken));
    return response.body.tokens.accessToken as string;
  }

  it("searches active collaborators across sectors without returning the current user", async () => {
    const response = await request(app.getHttpServer())
      .get("/chat/users?search=auxiliar&limit=20")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.users.some((user: { id: string }) => user.id === adminId)).toBe(false);
    expect(
      response.body.users.some(
        (user: { email: string }) => user.email === "auxiliar.fiscal@orion.local",
      ),
    ).toBe(true);
    expect(
      response.body.users.some(
        (user: { email: string }) => user.email === "auxiliar.contabil@orion.local",
      ),
    ).toBe(true);
  });

  it("creates one idempotent direct conversation without chat audit requirements", async () => {
    const directKey = [adminId, fiscalId].sort().join(":");
    const preexisting = await prisma.conversation.findUnique({ where: { directKey } });
    const created = await request(app.getHttpServer())
      .post("/chat/conversations/direct")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: fiscalId })
      .expect(201);
    conversationId = created.body.conversation.id;
    conversationWasCreatedBySuite = !preexisting;

    const repeated = await request(app.getHttpServer())
      .post("/chat/conversations/direct")
      .set("Authorization", `Bearer ${fiscalToken}`)
      .send({ userId: adminId })
      .expect(201);

    expect(repeated.body.conversation.id).toBe(conversationId);
    expect(created.body.conversation.participants).toHaveLength(2);
    expect(created.body.conversation.otherParticipant.id).toBe(fiscalId);
    expect(await prisma.auditLog.count({ where: { resourceId: conversationId } })).toBe(0);

    await request(app.getHttpServer())
      .post("/chat/conversations/direct")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: adminId })
      .expect(400);
  });

  it("persists messages for participants and hides the conversation from other users", async () => {
    const created = await request(app.getHttpServer())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "  Mensagem privada de integracao  " })
      .expect(201);
    createdMessageIds.push(created.body.message.id);

    expect(created.body.message.content).toBe("Mensagem privada de integracao");

    const listed = await request(app.getHttpServer())
      .get(`/chat/conversations/${conversationId}/messages?limit=50`)
      .set("Authorization", `Bearer ${fiscalToken}`)
      .expect(200);
    expect(
      listed.body.messages.some(
        (message: { id: string }) => message.id === created.body.message.id,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/chat/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${contabilToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/chat/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${contabilToken}`)
      .send({ content: "Acesso indevido" })
      .expect(404);
  });

  it("issues a short-lived realtime ticket only to an authenticated user", async () => {
    await request(app.getHttpServer()).post("/chat/realtime-ticket").expect(401);
    const response = await request(app.getHttpServer())
      .post("/chat/realtime-ticket")
      .set("Authorization", `Bearer ${fiscalToken}`)
      .send({})
      .expect(201);

    expect(response.body.ticket).toEqual(expect.any(String));
    expect(response.body.expiresIn).toBe(60);
  });
});

function getRefreshTokenId(refreshToken: string) {
  const payload = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64url").toString("utf8"));
  return payload.tokenId as string;
}
