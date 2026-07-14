import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import type { HealthStatus } from "@orion/shared";

import { PrismaService } from "../../database/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        database: "unavailable",
        service: "orion-backend",
        status: "error",
      });
    }

    return {
      database: "connected",
      status: "ok",
      service: "orion-backend",
    };
  }
}
