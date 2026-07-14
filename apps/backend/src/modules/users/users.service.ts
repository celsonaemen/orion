import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { HttpRequest } from "../auth/types/http-request";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { ListUsersQueryDto } from "./dto/list-users-query.dto";
import type { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

const PASSWORD_SALT_ROUNDS = 10;
const USER_AGENT_MAX_LENGTH = 512;
const IP_ADDRESS_MAX_LENGTH = 64;

const adminUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  lastLoginAt: true,
  name: true,
  role: {
    select: {
      hierarchyLevel: true,
      id: true,
      isActive: true,
      name: true,
      slug: true,
    },
  },
  sector: {
    select: {
      id: true,
      isActive: true,
      name: true,
      slug: true,
    },
  },
  status: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto, currentUser: AuthenticatedUser) {
    const page = query.page;
    const pageSize = query.pageSize;
    const filters: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.sectorId ? { sectorId: query.sectorId } : {}),
      ...(query.roleId ? { roleId: query.roleId } : {}),
    };
    const search = query.search?.trim();

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search.toLowerCase(), mode: "insensitive" } },
      ];
    }

    const where: Prisma.UserWhereInput = {
      AND: [filters, this.getReadScope(currentUser)],
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: adminUserSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        pageSize,
        total,
      },
    };
  }

  async getOptions() {
    const [roles, sectors] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        orderBy: [{ isActive: "desc" }, { hierarchyLevel: "asc" }],
        select: {
          hierarchyLevel: true,
          id: true,
          isActive: true,
          name: true,
          slug: true,
        },
      }),
      this.prisma.sector.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: {
          id: true,
          isActive: true,
          name: true,
          slug: true,
        },
      }),
    ]);

    return { roles, sectors };
  }

  async getById(id: string, currentUser: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      select: adminUserSelect,
      where: {
        AND: [{ deletedAt: null, id }, this.getReadScope(currentUser)],
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return { user };
  }

  async create(createUserDto: CreateUserDto, currentUser: AuthenticatedUser, request: HttpRequest) {
    const email = this.normalizeEmail(createUserDto.email);
    const role = await this.findActiveRole(createUserDto.roleId);
    const sector = createUserDto.sectorId
      ? await this.findActiveSector(createUserDto.sectorId)
      : null;
    const passwordHash = await bcrypt.hash(createUserDto.password, PASSWORD_SALT_ROUNDS);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: {
            email,
            name: createUserDto.name.trim(),
            passwordHash,
            roleId: role.id,
            sectorId: sector?.id,
            status: createUserDto.status ?? UserStatus.ACTIVE,
          },
          select: adminUserSelect,
        });

        await transaction.auditLog.create({
          data: {
            action: "USER_CREATED",
            actorUserId: currentUser.id,
            ipAddress: this.getIpAddress(request),
            metadata: {
              roleId: role.id,
              sectorId: sector?.id ?? null,
              userAgent: this.getUserAgent(request),
            },
            resourceId: created.id,
            resourceType: "User",
          },
        });

        return created;
      });

      return { user };
    } catch (error) {
      this.handlePrismaConflict(error, "User email already exists.");
      throw error;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: AuthenticatedUser,
    request: HttpRequest,
  ) {
    const existing = await this.findExistingUser(id);
    const data: Prisma.UserUpdateInput = {};
    const changedFields: string[] = [];
    let roleChange: { from: string; to: string } | undefined;
    let sectorChange: { from: string | null; to: string | null } | undefined;

    if (updateUserDto.name !== undefined) {
      const name = updateUserDto.name.trim();

      if (name !== existing.name) {
        data.name = name;
        changedFields.push("name");
      }
    }

    if (updateUserDto.email !== undefined) {
      const email = this.normalizeEmail(updateUserDto.email);

      if (email !== existing.email) {
        data.email = email;
        changedFields.push("email");
      }
    }

    if (updateUserDto.roleId !== undefined && updateUserDto.roleId !== existing.role.id) {
      const role = await this.findActiveRole(updateUserDto.roleId);
      data.role = { connect: { id: role.id } };
      changedFields.push("roleId");
      roleChange = { from: existing.role.id, to: role.id };
    }

    const existingSectorId = existing.sector?.id ?? null;

    if (updateUserDto.sectorId !== undefined && updateUserDto.sectorId !== existingSectorId) {
      if (updateUserDto.sectorId === null) {
        data.sector = { disconnect: true };
      } else {
        const sector = await this.findActiveSector(updateUserDto.sectorId);
        data.sector = { connect: { id: sector.id } };
      }

      changedFields.push("sectorId");
      sectorChange = { from: existingSectorId, to: updateUserDto.sectorId };
    }

    if (changedFields.length === 0) {
      return { user: existing };
    }

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          data,
          select: adminUserSelect,
          where: { id },
        });

        await transaction.auditLog.create({
          data: {
            action: "USER_UPDATED",
            actorUserId: currentUser.id,
            ipAddress: this.getIpAddress(request),
            metadata: {
              changedFields,
              ...(roleChange ? { roleChange } : {}),
              ...(sectorChange ? { sectorChange } : {}),
              userAgent: this.getUserAgent(request),
            },
            resourceId: id,
            resourceType: "User",
          },
        });

        return updated;
      });

      return { user };
    } catch (error) {
      this.handlePrismaConflict(error, "User email already exists.");
      throw error;
    }
  }

  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
    currentUser: AuthenticatedUser,
    request: HttpRequest,
  ) {
    const existing = await this.findExistingUser(id);

    if (id === currentUser.id && updateUserStatusDto.status === UserStatus.INACTIVE) {
      throw new BadRequestException("Authenticated user cannot deactivate their own account.");
    }

    if (existing.status === updateUserStatusDto.status) {
      return { user: existing };
    }

    const now = new Date();

    const user = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        data: { status: updateUserStatusDto.status },
        select: adminUserSelect,
        where: { id },
      });

      if (updateUserStatusDto.status === UserStatus.INACTIVE) {
        await transaction.userSession.updateMany({
          data: { revokedAt: now },
          where: {
            revokedAt: null,
            userId: id,
          },
        });
        await transaction.refreshToken.updateMany({
          data: { revokedAt: now },
          where: {
            revokedAt: null,
            userId: id,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          action: "USER_STATUS_CHANGED",
          actorUserId: currentUser.id,
          ipAddress: this.getIpAddress(request),
          metadata: {
            from: existing.status,
            to: updateUserStatusDto.status,
            userAgent: this.getUserAgent(request),
          },
          resourceId: id,
          resourceType: "User",
        },
      });

      return updated;
    });

    return { user };
  }

  private async findExistingUser(id: string) {
    const user = await this.prisma.user.findFirst({
      select: adminUserSelect,
      where: {
        deletedAt: null,
        id,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  private getReadScope(currentUser: AuthenticatedUser): Prisma.UserWhereInput {
    if (currentUser.role.hierarchyLevel <= 1) {
      return {};
    }

    if (!currentUser.sector) {
      return { id: { in: [] } };
    }

    return { sectorId: currentUser.sector.id };
  }

  private async findActiveRole(id: string) {
    const role = await this.prisma.role.findFirst({
      select: { id: true },
      where: {
        id,
        isActive: true,
      },
    });

    if (!role) {
      throw new BadRequestException("Role is invalid or inactive.");
    }

    return role;
  }

  private async findActiveSector(id: string) {
    const sector = await this.prisma.sector.findFirst({
      select: { id: true },
      where: {
        id,
        isActive: true,
      },
    });

    if (!sector) {
      throw new BadRequestException("Sector is invalid or inactive.");
    }

    return sector;
  }

  private handlePrismaConflict(error: unknown, message: string): never | void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(message);
    }
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
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
