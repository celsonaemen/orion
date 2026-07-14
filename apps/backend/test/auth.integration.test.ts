import { ExecutionContext, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedDatabase } from "../prisma/seed";
import { PrismaService } from "../src/database/prisma/prisma.service";
import { AuthModule } from "../src/modules/auth/auth.module";
import { PermissionsGuard } from "../src/modules/auth/guards/permissions.guard";
import type { AuthenticatedUser } from "../src/modules/auth/types/authenticated-user";

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

describeWithDatabase("auth integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    prisma = moduleRef.get(PrismaService);
    await app.init();
    await seedDatabase(prisma);
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.userSession.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  function login(email: string, password = DEV_PASSWORD) {
    return request(app.getHttpServer()).post("/auth/login").send({ email, password });
  }

  it("logs in a seeded active user and returns tokens without password data", async () => {
    const response = await login("admin@orion.local").expect(201);

    expect(response.body.tokens.accessToken).toEqual(expect.any(String));
    expect(response.body.tokens.refreshToken).toEqual(expect.any(String));
    expect(response.body.tokens.tokenType).toBe("Bearer");
    expect(response.body.user.email).toBe("admin@orion.local");
    expect(response.body.user.permissions).toContain("audit.read");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects invalid credentials", async () => {
    await login("admin@orion.local", "wrong-password").expect(401);
  });

  it("returns the authenticated user from /auth/me", async () => {
    const loginResponse = await login("gerente@orion.local").expect(201);

    const response = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.tokens.accessToken}`)
      .expect(200);

    expect(response.body.user.email).toBe("gerente@orion.local");
    expect(response.body.user.role.slug).toBe("gerente");
  });

  it("rotates refresh tokens and rejects reuse of the old refresh token", async () => {
    const loginResponse = await login("coordenador.fiscal@orion.local").expect(201);
    const firstRefreshToken = loginResponse.body.tokens.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    expect(refreshResponse.body.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.tokens.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.tokens.refreshToken).not.toBe(firstRefreshToken);

    await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(401);
  });

  it("logs out and invalidates the current access token session", async () => {
    const loginResponse = await login("auxiliar.fiscal@orion.local").expect(201);
    const { accessToken, refreshToken } = loginResponse.body.tokens;

    await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(201)
      .expect({ status: "ok" });

    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);
  });
});

describe("permissions guard", () => {
  it("allows and denies access by explicit permission code", () => {
    const reflector = {
      getAllAndOverride: () => ["audit.read"],
    };
    const guard = new PermissionsGuard(reflector as never);
    const allowedContext = createExecutionContext(["audit.read", "users.read"]);
    const deniedContext = createExecutionContext(["conversations.read-own"]);

    expect(guard.canActivate(allowedContext)).toBe(true);
    expect(() => guard.canActivate(deniedContext)).toThrow("Insufficient permissions.");
  });
});

function createExecutionContext(permissions: string[]) {
  return {
    getClass: () => AuthModule,
    getHandler: () => createExecutionContext,
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          permissions,
        } satisfies Partial<AuthenticatedUser>,
      }),
    }),
  } as unknown as ExecutionContext;
}
