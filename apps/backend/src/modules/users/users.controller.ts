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
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions("users.read")
  @Get()
  list(@Query() query: ListUsersQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.list(query, currentUser);
  }

  @RequirePermissions("users.read")
  @Get("options")
  options() {
    return this.usersService.getOptions();
  }

  @RequirePermissions("users.read")
  @Get(":id")
  getById(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.getById(id, currentUser);
  }

  @RequirePermissions("users.create")
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.usersService.create(createUserDto, currentUser, request);
  }

  @RequirePermissions("users.update")
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser, request);
  }

  @RequirePermissions("users.change-status")
  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto, currentUser, request);
  }
}
