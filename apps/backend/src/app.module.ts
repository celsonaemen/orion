import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { SectorsModule } from "./modules/sectors/sectors.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [DatabaseModule, AuthModule, HealthModule, UsersModule, SectorsModule],
})
export class AppModule {}
