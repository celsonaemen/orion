import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import "dotenv/config";

import { AppModule } from "./app.module";
import { readRuntimeConfig } from "./config/runtime-config";

async function bootstrap() {
  const runtimeConfig = readRuntimeConfig();
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(runtimeConfig.port, runtimeConfig.host);
}

void bootstrap();
