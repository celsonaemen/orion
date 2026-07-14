import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "../../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";

@Module({
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard],
  imports: [DatabaseModule, JwtModule.register({})],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
