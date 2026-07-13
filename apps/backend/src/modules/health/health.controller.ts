import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@orion/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return {
      status: "ok",
      service: "orion-backend"
    };
  }
}
