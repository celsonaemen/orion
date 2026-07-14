import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { HttpRequest } from "../auth/types/http-request";
import { CreateSectorDto } from "./dto/create-sector.dto";
import { ListSectorsQueryDto } from "./dto/list-sectors-query.dto";
import { UpdateSectorDto } from "./dto/update-sector.dto";
import { SectorsService } from "./sectors.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("sectors")
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @RequirePermissions("sectors.read")
  @Get()
  list(@Query() query: ListSectorsQueryDto) {
    return this.sectorsService.list(query);
  }

  @RequirePermissions("sectors.read")
  @Get(":id")
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.sectorsService.getById(id);
  }

  @RequirePermissions("sectors.create")
  @Post()
  create(
    @Body() createSectorDto: CreateSectorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.sectorsService.create(createSectorDto, currentUser, request);
  }

  @RequirePermissions("sectors.update")
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSectorDto: UpdateSectorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.sectorsService.update(id, updateSectorDto, currentUser, request);
  }
}
