import { randomUUID } from "node:crypto";

import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, type UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { AuthenticatedUser } from "./types/authenticated-user";
import type { HttpRequest } from "./types/http-request";
import type { AccessTokenPayload, AuthTokens, RefreshTokenPayload } from "./types/token-payload";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const HASH_SALT_ROUNDS = 10;
const USER_AGENT_MAX_LENGTH = 512;
const IP_ADDRESS_MAX_LENGTH = 64;

const userWithAccessInclude = {
  role: {
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  },
  sector: true,
} satisfies Prisma.UserInclude;

type UserWithAccess = Prisma.UserGetPayload<{
  include: typeof userWithAccessInclude;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto, request: HttpRequest) {
    this.assertJwtConfig();

    const email = this.normalizeEmail(loginDto.email);
    const user = await this.prisma.user.findUnique({
      include: userWithAccessInclude,
      where: { email },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const now = new Date();
    const sessionIdentifier = randomUUID();
    const refreshExpiresAt = this.getRefreshExpiresAt(now);

    await this.prisma.userSession.create({
      data: {
        expiresAt: refreshExpiresAt,
        ipAddress: this.getIpAddress(request),
        lastActivityAt: now,
        sessionIdentifier,
        userAgent: this.getUserAgent(request),
        userId: user.id,
      },
    });

    await this.prisma.user.update({
      data: { lastLoginAt: now },
      where: { id: user.id },
    });

    await this.writeAuditLog(user.id, "LOGIN", "UserSession", sessionIdentifier, request);

    const tokens = await this.issueTokenPair(user, sessionIdentifier, refreshExpiresAt);

    return {
      tokens,
      user: this.toAuthenticatedUser(user, sessionIdentifier),
    };
  }

  async refresh(refreshToken: string, request: HttpRequest) {
    this.assertJwtConfig();

    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      include: {
        user: {
          include: userWithAccessInclude,
        },
      },
      where: { id: payload.tokenId },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, storedToken.tokenHash);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const session = await this.prisma.userSession.findUnique({
      where: { sessionIdentifier: payload.sessionId },
    });

    if (
      !session ||
      session.userId !== storedToken.userId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException("Invalid session.");
    }

    const user = storedToken.user;

    if (user.deletedAt || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User is not active.");
    }

    const now = new Date();
    const refreshExpiresAt = this.getRefreshExpiresAt(now);

    await this.prisma.refreshToken.update({
      data: { revokedAt: now },
      where: { id: storedToken.id },
    });

    await this.prisma.userSession.update({
      data: {
        expiresAt: refreshExpiresAt,
        ipAddress: this.getIpAddress(request),
        lastActivityAt: now,
        userAgent: this.getUserAgent(request),
      },
      where: { sessionIdentifier: payload.sessionId },
    });

    const tokens = await this.issueTokenPair(user, payload.sessionId, refreshExpiresAt);

    return {
      tokens,
      user: this.toAuthenticatedUser(user, payload.sessionId),
    };
  }

  async logout(
    currentUser: AuthenticatedUser,
    refreshToken: string | undefined,
    request: HttpRequest,
  ) {
    const now = new Date();

    if (refreshToken) {
      const payload = await this.verifyRefreshToken(refreshToken);

      if (payload.sub !== currentUser.id || payload.sessionId !== currentUser.sessionId) {
        throw new UnauthorizedException("Invalid refresh token.");
      }

      await this.prisma.refreshToken.updateMany({
        data: { revokedAt: now },
        where: {
          id: payload.tokenId,
          revokedAt: null,
          userId: currentUser.id,
        },
      });
    }

    await this.prisma.userSession.updateMany({
      data: { revokedAt: now },
      where: {
        revokedAt: null,
        sessionIdentifier: currentUser.sessionId,
        userId: currentUser.id,
      },
    });

    await this.writeAuditLog(
      currentUser.id,
      "LOGOUT",
      "UserSession",
      currentUser.sessionId,
      request,
    );

    return {
      status: "ok",
    };
  }

  async validateAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.verifyAccessToken(accessToken);
    const session = await this.prisma.userSession.findUnique({
      where: { sessionIdentifier: payload.sessionId },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException("Invalid session.");
    }

    const user = await this.prisma.user.findUnique({
      include: userWithAccessInclude,
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User is not active.");
    }

    await this.prisma.userSession.update({
      data: { lastActivityAt: new Date() },
      where: { sessionIdentifier: payload.sessionId },
    });

    return this.toAuthenticatedUser(user, payload.sessionId);
  }

  private async issueTokenPair(
    user: UserWithAccess,
    sessionId: string,
    refreshExpiresAt: Date,
  ): Promise<AuthTokens> {
    const tokenId = randomUUID();
    const accessTokenExpiresIn = this.getAccessTokenTtlSeconds();
    const accessPayload: AccessTokenPayload = {
      email: user.email,
      sessionId,
      sub: user.id,
      tokenUse: "access",
    };
    const refreshPayload: RefreshTokenPayload = {
      sessionId,
      sub: user.id,
      tokenId,
      tokenUse: "refresh",
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: accessTokenExpiresIn,
      secret: this.getAccessTokenSecret(),
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.getRefreshTokenTtlSeconds(),
      secret: this.getRefreshTokenSecret(),
    });
    const tokenHash = await bcrypt.hash(refreshToken, HASH_SALT_ROUNDS);

    await this.prisma.refreshToken.create({
      data: {
        expiresAt: refreshExpiresAt,
        id: tokenId,
        tokenHash,
        userId: user.id,
      },
    });

    return {
      accessToken,
      expiresIn: accessTokenExpiresIn,
      refreshToken,
      tokenType: "Bearer",
    };
  }

  private async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken, {
        secret: this.getAccessTokenSecret(),
      });

      if (payload.tokenUse !== "access" || !payload.sub || !payload.sessionId) {
        throw new UnauthorizedException("Invalid access token.");
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid access token.");
    }
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });

      if (
        payload.tokenUse !== "refresh" ||
        !payload.sub ||
        !payload.sessionId ||
        !payload.tokenId
      ) {
        throw new UnauthorizedException("Invalid refresh token.");
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid refresh token.");
    }
  }

  private toAuthenticatedUser(user: UserWithAccess, sessionId: string): AuthenticatedUser {
    return {
      email: user.email,
      id: user.id,
      name: user.name,
      permissions: user.role.rolePermissions
        .map((rolePermission) => rolePermission.permission.code)
        .sort(),
      role: {
        hierarchyLevel: user.role.hierarchyLevel,
        id: user.role.id,
        name: user.role.name,
        slug: user.role.slug,
      },
      sector: user.sector
        ? {
            id: user.sector.id,
            name: user.sector.name,
            slug: user.sector.slug,
          }
        : null,
      sessionId,
      status: user.status as UserStatus,
    };
  }

  private async writeAuditLog(
    actorUserId: string,
    action: "LOGIN" | "LOGOUT",
    resourceType: string,
    resourceId: string,
    request: HttpRequest,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        actorUserId,
        ipAddress: this.getIpAddress(request),
        metadata: {
          userAgent: this.getUserAgent(request),
        },
        resourceId,
        resourceType,
      },
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private getAccessTokenSecret() {
    return this.getRequiredEnv("JWT_SECRET");
  }

  private getRefreshTokenSecret() {
    return this.getRequiredEnv("JWT_REFRESH_SECRET");
  }

  private getAccessTokenTtlSeconds() {
    return this.getPositiveIntegerEnv(
      "JWT_ACCESS_TOKEN_TTL_SECONDS",
      DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  private getRefreshTokenTtlSeconds() {
    return this.getPositiveIntegerEnv(
      "JWT_REFRESH_TOKEN_TTL_SECONDS",
      DEFAULT_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    );
  }

  private getRefreshExpiresAt(referenceDate: Date) {
    return new Date(referenceDate.getTime() + this.getRefreshTokenTtlSeconds() * 1000);
  }

  private assertJwtConfig() {
    this.getAccessTokenSecret();
    this.getRefreshTokenSecret();
  }

  private getPositiveIntegerEnv(name: string, fallback: number) {
    const value = process.env[name];

    if (!value) {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new InternalServerErrorException(`${name} must be a positive integer.`);
    }

    return parsed;
  }

  private getRequiredEnv(name: string) {
    const value = process.env[name];

    if (!value || value.startsWith("replace_in")) {
      throw new InternalServerErrorException(`${name} is not configured.`);
    }

    return value;
  }

  private getIpAddress(request: HttpRequest) {
    return this.truncate(request.ip, IP_ADDRESS_MAX_LENGTH);
  }

  private getUserAgent(request: HttpRequest) {
    const userAgent = request.headers["user-agent"];
    return this.truncate(
      Array.isArray(userAgent) ? userAgent.join(" ") : userAgent,
      USER_AGENT_MAX_LENGTH,
    );
  }

  private truncate(value: string | undefined, maxLength: number) {
    if (!value) {
      return undefined;
    }

    return value.slice(0, maxLength);
  }
}
