import { randomUUID } from "node:crypto";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
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

describeWithDatabase("admin users and sectors integration", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let auxiliarToken: string;
  let coordinatorToken: string;
  const suiteId = randomUUID();
  const createdUserIds: string[] = [];
  const createdSectorIds: string[] = [];
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
            "auxiliar.fiscal@orion.local",
            "coordenador.fiscal@orion.local",
          ],
        },
      },
    });

    for (const user of fixtureUsers) {
      originalLastLoginByUserId.set(user.id, user.lastLoginAt);
    }

    adminToken = await loginAndGetToken("admin@orion.local");
    auxiliarToken = await loginAndGetToken("auxiliar.fiscal@orion.local");
    coordinatorToken = await loginAndGetToken("coordenador.fiscal@orion.local");
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          {
            resourceId: {
              in: [...createdUserIds, ...createdSectorIds, ...createdSessionIdentifiers],
            },
          },
        ],
      },
    });
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ id: { in: [...createdRefreshTokenIds] } }, { userId: { in: createdUserIds } }],
      },
    });
    await prisma.userSession.deleteMany({
      where: {
        OR: [
          { sessionIdentifier: { in: [...createdSessionIdentifiers] } },
          { userId: { in: createdUserIds } },
        ],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.sector.deleteMany({ where: { id: { in: createdSectorIds } } });

    for (const [id, lastLoginAt] of originalLastLoginByUserId) {
      await prisma.user.update({ data: { lastLoginAt }, where: { id } });
    }

    await app?.close();
    await prisma?.$disconnect();
  });

  async function loginAndGetToken(email: string, password = DEV_PASSWORD) {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email,
        password,
      })
      .expect(201);

    if (response.body.user?.sessionId) {
      createdSessionIdentifiers.add(response.body.user.sessionId);
    }

    if (response.body.tokens?.refreshToken) {
      createdRefreshTokenIds.add(getRefreshTokenId(response.body.tokens.refreshToken));
    }

    return response.body.tokens.accessToken as string;
  }

  async function getAuxiliaryRoleAndSector() {
    const [role, sector] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { slug: "auxiliar" } }),
      prisma.sector.findUniqueOrThrow({ where: { slug: "fiscal" } }),
    ]);

    return { role, sector };
  }

  async function createUserThroughApi(emailPrefix: string) {
    const { role, sector } = await getAuxiliaryRoleAndSector();
    const response = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `${emailPrefix}-${suiteId}@orion.local`,
        name: `Usuario Teste ${emailPrefix}`,
        password: DEV_PASSWORD,
        roleId: role.id,
        sectorId: sector.id,
        status: "ACTIVE",
      })
      .expect(201);

    createdUserIds.push(response.body.user.id);
    return response.body.user as { id: string; email: string };
  }

  it("allows an authorized user to list users with pagination", async () => {
    const response = await request(app.getHttpServer())
      .get("/users?page=1&pageSize=2")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.pagination.total).toBeGreaterThan(0);
    expect(response.body.data[0].passwordHash).toBeUndefined();
  });

  it("rejects users without permission and unauthenticated requests", async () => {
    await request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${auxiliarToken}`)
      .expect(403);

    await request(app.getHttpServer()).get("/users").expect(401);
  });

  it("enforces permissions on administrative mutations", async () => {
    const { role, sector } = await getAuxiliaryRoleAndSector();

    await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${auxiliarToken}`)
      .send({
        email: `forbidden-${suiteId}@orion.local`,
        name: "Usuario Sem Permissao",
        password: DEV_PASSWORD,
        roleId: role.id,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/sectors/${sector.id}`)
      .set("Authorization", `Bearer ${auxiliarToken}`)
      .send({ name: "Alteracao Indevida" })
      .expect(403);
  });

  it("limits coordinator user reads to their own sector", async () => {
    const fiscalUser = await createUserThroughApi("coordinator-scope");
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@orion.local" } });

    const response = await request(app.getHttpServer())
      .get("/users?page=1&pageSize=50")
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .expect(200);

    expect(response.body.data.some((item: { id: string }) => item.id === fiscalUser.id)).toBe(true);
    expect(response.body.data.some((item: { id: string }) => item.id === admin.id)).toBe(false);
    expect(
      response.body.data.every(
        (item: { sector: { slug: string } | null }) => item.sector?.slug === "fiscal",
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/users/${fiscalUser.id}`)
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/users/${admin.id}`)
      .set("Authorization", `Bearer ${coordinatorToken}`)
      .expect(404);
  });

  it("creates a user with hashed password and no password data in the response", async () => {
    const user = await createUserThroughApi("create");
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    expect(user.email).toBe(`create-${suiteId}@orion.local`);
    expect("passwordHash" in user).toBe(false);
    expect(stored.passwordHash).not.toBe(DEV_PASSWORD);
    await expect(bcrypt.compare(DEV_PASSWORD, stored.passwordHash)).resolves.toBe(true);
  });

  it("rejects duplicated user e-mail", async () => {
    const user = await createUserThroughApi("duplicate");
    const { role } = await getAuxiliaryRoleAndSector();

    await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: user.email.toUpperCase(),
        name: "Usuario Duplicado",
        password: DEV_PASSWORD,
        roleId: role.id,
        status: "ACTIVE",
      })
      .expect(409);
  });

  it("rejects names that become invalid after trimming", async () => {
    const { role } = await getAuxiliaryRoleAndSector();
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@orion.local" } });
    const fiscal = await prisma.sector.findUniqueOrThrow({ where: { slug: "fiscal" } });

    await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `blank-name-${suiteId}@orion.local`,
        name: "  ",
        password: DEV_PASSWORD,
        roleId: role.id,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post("/sectors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: " A" })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/users/${admin.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: null, name: null, roleId: null })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/sectors/${fiscal.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: null, name: null })
      .expect(400);
  });

  it("updates a user with safe fields only", async () => {
    const user = await createUserThroughApi("update");
    const { role: originalRole, sector } = await getAuxiliaryRoleAndSector();
    const nextRole = await prisma.role.findUniqueOrThrow({ where: { slug: "coordenador" } });

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `updated-${suiteId}@orion.local`,
        name: "Usuario Atualizado",
        roleId: nextRole.id,
        sectorId: null,
      })
      .expect(200);

    expect(response.body.user.email).toBe(`updated-${suiteId}@orion.local`);
    expect(response.body.user.sector).toBeNull();
    expect(response.body.user.passwordHash).toBeUndefined();
    const auditLog = await prisma.auditLog.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
      where: { action: "USER_UPDATED", resourceId: user.id },
    });

    expect(auditLog.metadata).toMatchObject({
      roleChange: { from: originalRole.id, to: nextRole.id },
      sectorChange: { from: sector.id, to: null },
    });
  });

  it("deactivates a user and revokes existing sessions and refresh tokens", async () => {
    const user = await createUserThroughApi("inactive-login");
    const userAccessToken = await loginAndGetToken(user.email);

    await request(app.getHttpServer())
      .patch(`/users/${user.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${userAccessToken}`)
      .expect(401);

    await expect(
      prisma.userSession.count({ where: { revokedAt: null, userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.refreshToken.count({ where: { revokedAt: null, userId: user.id } }),
    ).resolves.toBe(0);

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: user.email, password: DEV_PASSWORD })
      .expect(401);
  });

  it("prevents the authenticated user from deactivating their own account", async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@orion.local" } });

    await request(app.getHttpServer())
      .patch(`/users/${admin.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" })
      .expect(400);
  });

  it("reactivates a user", async () => {
    const user = await createUserThroughApi("reactivate");

    await request(app.getHttpServer())
      .patch(`/users/${user.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" })
      .expect(200);

    const response = await request(app.getHttpServer())
      .patch(`/users/${user.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ACTIVE" })
      .expect(200);

    expect(response.body.user.status).toBe("ACTIVE");
  });

  it("filters users by search and status", async () => {
    const user = await createUserThroughApi("filter");
    const { role, sector } = await getAuxiliaryRoleAndSector();

    const response = await request(app.getHttpServer())
      .get(
        `/users?search=${encodeURIComponent(user.email)}&status=ACTIVE&roleId=${role.id}&sectorId=${sector.id}&page=1&pageSize=10`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.some((item: { id: string }) => item.id === user.id)).toBe(true);
  });

  it("creates a sector and rejects duplicated slug", async () => {
    const slug = `admin-test-${suiteId}`;
    const response = await request(app.getHttpServer())
      .post("/sectors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        description: "Setor ficticio de teste.",
        name: `Setor Teste ${suiteId}`,
        slug,
      })
      .expect(201);

    createdSectorIds.push(response.body.sector.id);
    expect(response.body.sector.slug).toBe(slug);

    await request(app.getHttpServer())
      .post("/sectors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Setor Teste Duplicado ${suiteId}`,
        slug,
      })
      .expect(409);
  });

  it("updates a sector without changing its slug", async () => {
    const slug = `admin-update-${suiteId}`;
    const created = await request(app.getHttpServer())
      .post("/sectors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Setor Update ${suiteId}`,
        slug,
      })
      .expect(201);
    createdSectorIds.push(created.body.sector.id);

    const response = await request(app.getHttpServer())
      .patch(`/sectors/${created.body.sector.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        description: "Descricao atualizada.",
        isActive: false,
        name: `Setor Atualizado ${suiteId}`,
      })
      .expect(200);

    expect(response.body.sector.name).toBe(`Setor Atualizado ${suiteId}`);
    expect(response.body.sector.slug).toBe(slug);
    expect(response.body.sector.isActive).toBe(false);
  });

  it("lists sectors with search and pagination", async () => {
    const response = await request(app.getHttpServer())
      .get("/sectors?page=1&pageSize=5&search=fiscal&sortBy=name&sortDirection=asc")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeLessThanOrEqual(5);
    expect(response.body.pagination.total).toBeGreaterThan(0);
    expect(response.body.data[0].userCount).toEqual(expect.any(Number));

    await request(app.getHttpServer())
      .get("/sectors?isActive=not-a-boolean")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
  });

  it("allows safe edits while preserving an inactive sector assignment", async () => {
    const { role } = await getAuxiliaryRoleAndSector();
    const sectorResponse = await request(app.getHttpServer())
      .post("/sectors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Setor Inativo ${suiteId}`,
        slug: `inactive-${suiteId}`,
      })
      .expect(201);
    const sectorId = sectorResponse.body.sector.id as string;
    createdSectorIds.push(sectorId);

    const userResponse = await request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `inactive-sector-${suiteId}@orion.local`,
        name: "Usuario Setor Inativo",
        password: DEV_PASSWORD,
        roleId: role.id,
        sectorId,
      })
      .expect(201);
    const userId = userResponse.body.user.id as string;
    createdUserIds.push(userId);

    await request(app.getHttpServer())
      .patch(`/sectors/${sectorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    const options = await request(app.getHttpServer())
      .get("/users/options")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      options.body.sectors.some(
        (sector: { id: string; isActive: boolean }) =>
          sector.id === sectorId && sector.isActive === false,
      ),
    ).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `inactive-sector-updated-${suiteId}@orion.local`,
        name: "Usuario Setor Inativo Atualizado",
        roleId: role.id,
        sectorId,
      })
      .expect(200);

    expect(updated.body.user.sector.id).toBe(sectorId);
  });

  it("writes audit logs without sensitive data", async () => {
    const user = await createUserThroughApi("audit");
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        resourceId: user.id,
        resourceType: "User",
      },
    });
    const serializedMetadata = JSON.stringify(auditLogs.map((log) => log.metadata));

    expect(auditLogs.length).toBeGreaterThan(0);
    expect(serializedMetadata).not.toContain("password");
    expect(serializedMetadata).not.toContain("token");
    expect(serializedMetadata).not.toContain("hash");
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
