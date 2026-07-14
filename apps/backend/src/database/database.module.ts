import { Module } from "@nestjs/common";

import { PrismaModule } from "./prisma/prisma.module";

@Module({
  exports: [PrismaModule],
  imports: [PrismaModule],
})
export class DatabaseModule {}
