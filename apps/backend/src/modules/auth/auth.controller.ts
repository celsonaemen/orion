import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthenticatedUser } from "./types/authenticated-user";
import type { HttpRequest } from "./types/http-request";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() loginDto: LoginDto, @Req() request: HttpRequest) {
    return this.authService.login(loginDto, request);
  }

  @Post("refresh")
  refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: HttpRequest) {
    return this.authService.refresh(refreshTokenDto.refreshToken, request);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() logoutDto: LogoutDto,
    @Req() request: HttpRequest,
  ) {
    return this.authService.logout(currentUser, logoutDto.refreshToken, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return {
      user: currentUser,
    };
  }
}
