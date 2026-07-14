import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { HttpRequest } from "../auth/types/http-request";
import type { CreateSectorDto } from "./dto/create-sector.dto";
import type { ListSectorsQueryDto } from "./dto/list-sectors-query.dto";
import type { UpdateSectorDto } from "./dto/update-sector.dto";

const USER_AGENT_MAX_LENGTH = 512;
const IP_ADDRESS_MAX_LENGTH = 64;

const sectorSelect = {
  _count: {
    select: {
      users: true,
    },
  },
  createdAt: true,
  description: true,
  id: true,
  isActive: true,
  name: true,
  slug: true,
  updatedAt: true,
} satisfies Prisma.SectorSelect;

@Injectable()
export class SectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSectorsQueryDto) {
    const page = query.page;
    const pageSize = query.pageSize;
    const where: Prisma.SectorWhereInput = {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const search = query.search?.trim();

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: this.normalizeSlug(search), mode: "insensitive" } },
      ];
    }

    const [total, sectors] = await this.prisma.$transaction([
      this.prisma.sector.count({ where }),
      this.prisma.sector.findMany({
        orderBy: [{ [query.sortBy]: query.sortDirection }, { id: query.sortDirection }],
        select: sectorSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
      }),
    ]);

    return {
      data: sectors.map((sector) => ({
        ...sector,
        userCount: sector._count.users,
        _count: undefined,
      })),
      pagination: {
        page,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        pageSize,
        total,
      },
    };
  }

  async getById(id: string) {
    const sector = await this.prisma.sector.findUnique({
      select: sectorSelect,
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException("Sector not found.");
    }

    return {
      sector: {
        ...sector,
        userCount: sector._count.users,
        _count: undefined,
      },
    };
  }

  async create(
    createSectorDto: CreateSectorDto,
    currentUser: AuthenticatedUser,
    request: HttpRequest,
  ) {
    const slug = this.normalizeSlug(createSectorDto.slug ?? createSectorDto.name);

    if (!slug) {
      throw new BadRequestException("Sector slug is invalid.");
    }

    try {
      const sector = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.sector.create({
          data: {
            description: this.normalizeDescription(createSectorDto.description),
            isActive: createSectorDto.isActive ?? true,
            name: createSectorDto.name.trim(),
            slug,
          },
          select: sectorSelect,
        });

        await transaction.auditLog.create({
          data: {
            action: "SECTOR_ASSIGNED",
            actorUserId: currentUser.id,
            ipAddress: this.getIpAddress(request),
            metadata: {
              event: "SECTOR_CREATED",
              slug,
              userAgent: this.getUserAgent(request),
            },
            resourceId: created.id,
            resourceType: "Sector",
          },
        });

        return created;
      });

      return {
        sector: {
          ...sector,
          userCount: sector._count.users,
          _count: undefined,
        },
      };
    } catch (error) {
      this.handlePrismaConflict(error, "Sector name or slug already exists.");
      throw error;
    }
  }

  async update(
    id: string,
    updateSectorDto: UpdateSectorDto,
    currentUser: AuthenticatedUser,
    request: HttpRequest,
  ) {
    const existing = await this.findExistingSector(id);

    const data: Prisma.SectorUpdateInput = {};
    const changedFields: string[] = [];

    if (updateSectorDto.name !== undefined) {
      const name = updateSectorDto.name.trim();

      if (name !== existing.name) {
        data.name = name;
        changedFields.push("name");
      }
    }

    if (updateSectorDto.description !== undefined) {
      const description = this.normalizeDescription(updateSectorDto.description);

      if (description !== existing.description) {
        data.description = description;
        changedFields.push("description");
      }
    }

    if (updateSectorDto.isActive !== undefined && updateSectorDto.isActive !== existing.isActive) {
      data.isActive = updateSectorDto.isActive;
      changedFields.push("isActive");
    }

    if (changedFields.length === 0) {
      return this.getById(id);
    }

    try {
      const sector = await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.sector.update({
          data,
          select: sectorSelect,
          where: { id },
        });

        await transaction.auditLog.create({
          data: {
            action: "SECTOR_ASSIGNED",
            actorUserId: currentUser.id,
            ipAddress: this.getIpAddress(request),
            metadata: {
              changedFields,
              event: "SECTOR_UPDATED",
              userAgent: this.getUserAgent(request),
            },
            resourceId: id,
            resourceType: "Sector",
          },
        });

        return updated;
      });

      return {
        sector: {
          ...sector,
          userCount: sector._count.users,
          _count: undefined,
        },
      };
    } catch (error) {
      this.handlePrismaConflict(error, "Sector name already exists.");
      throw error;
    }
  }

  private async findExistingSector(id: string) {
    const sector = await this.prisma.sector.findUnique({
      select: {
        description: true,
        id: true,
        isActive: true,
        name: true,
      },
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException("Sector not found.");
    }

    return sector;
  }

  private handlePrismaConflict(error: unknown, message: string): never | void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(message);
    }
  }

  private normalizeSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeDescription(value: string | null | undefined) {
    const description = value?.trim();
    return description ? description : null;
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
