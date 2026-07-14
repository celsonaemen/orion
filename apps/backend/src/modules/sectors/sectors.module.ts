import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { SectorsController } from "./sectors.controller";
import { SectorsService } from "./sectors.service";

@Module({
  controllers: [SectorsController],
  imports: [AuthModule, DatabaseModule],
  providers: [SectorsService],
})
export class SectorsModule {}
