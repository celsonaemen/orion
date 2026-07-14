import { randomUUID } from "node:crypto";

import { INestApplication } from "@nestjs/common";
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

async function canConnect() {
  if (!databaseUrl) {
    return false;
  }

  const prisma = createPrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

describeWithDatabase("database integration", () => {
  let prisma: PrismaClient;
  let app: INestApplication;
  let databaseAvailable = false;

  beforeAll(async () => {
    databaseAvailable = await canConnect();
    prisma = createPrismaClient();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("connects to PostgreSQL through Prisma", async () => {
    expect(databaseAvailable).toBe(true);
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });

  it("reports backend health with database connection", async () => {
    expect(databaseAvailable).toBe(true);

    await request(app.getHttpServer()).get("/health").expect(200).expect({
      database: "connected",
      service: "orion-backend",
      status: "ok",
    });
  });

  it("runs the seed idempotently", async () => {
    expect(databaseAvailable).toBe(true);
    await seedDatabase(prisma);
    await seedDatabase(prisma);

    await expect(prisma.role.count({ where: { slug: "gerente" } })).resolves.toBe(1);
    await expect(
      prisma.permission.count({ where: { code: "conversations.supervise" } }),
    ).resolves.toBe(1);
  });

  it("enforces unique user email", async () => {
    expect(databaseAvailable).toBe(true);
    const suffix = randomUUID();
    const passwordHash = await bcrypt.hash("OrionTest123!", 10);
    const role = await prisma.role.findUniqueOrThrow({ where: { slug: "auxiliar" } });

    await prisma.user.create({
      data: {
        email: `duplicate-${suffix}@orion.local`,
        name: `Usuário Teste ${suffix}`,
        passwordHash,
        roleId: role.id,
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: `duplicate-${suffix}@orion.local`,
          name: `Usuário Teste Duplicado ${suffix}`,
          passwordHash,
          roleId: role.id,
        },
      }),
    ).rejects.toThrow();
  });

  it("enforces unique permission code", async () => {
    expect(databaseAvailable).toBe(true);
    const code = `test.permission.${randomUUID()}`;

    await prisma.permission.create({
      data: {
        code,
        description: "Permissão fictícia de teste.",
      },
    });

    await expect(
      prisma.permission.create({
        data: {
          code,
          description: "Permissão fictícia duplicada.",
        },
      }),
    ).rejects.toThrow();
  });

  it("creates a user with role and sector", async () => {
    expect(databaseAvailable).toBe(true);
    const suffix = randomUUID();
    const role = await prisma.role.findUniqueOrThrow({ where: { slug: "auxiliar" } });
    const sector = await prisma.sector.findUniqueOrThrow({ where: { slug: "fiscal" } });
    const passwordHash = await bcrypt.hash("OrionTest123!", 10);

    const user = await prisma.user.create({
      data: {
        email: `sector-user-${suffix}@orion.local`,
        name: `Usuário Setor ${suffix}`,
        passwordHash,
        roleId: role.id,
        sectorId: sector.id,
      },
      include: {
        role: true,
        sector: true,
      },
    });

    expect(user.role.slug).toBe("auxiliar");
    expect(user.sector?.slug).toBe("fiscal");
  });

  it("relates roles and permissions without allowing duplicates", async () => {
    expect(databaseAvailable).toBe(true);
    const role = await prisma.role.findUniqueOrThrow({ where: { slug: "auxiliar" } });
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: "conversations.read-own" },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    await expect(
      prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      }),
    ).rejects.toThrow();
  });
});
