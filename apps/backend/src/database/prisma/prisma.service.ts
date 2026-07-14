import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { createPrismaAdapter } from "./prisma-client.factory";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: createPrismaAdapter(),
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      this.logger.warn("Database connection is unavailable during startup.");
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
