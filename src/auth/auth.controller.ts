import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthErrorCode, unauthorized } from './auth-error.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthResponse, AuthenticatedUser, JwtPayload } from './interfaces/auth.interface.js';
import { RefreshCookieService } from './refresh-cookie.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly refreshCookie: RefreshCookieService,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponse> {
    const auth = await this.authService.loginWithGoogle(dto.idToken);

    if (this.refreshTokens.enabled) {
      const token = await this.refreshTokens.issue(auth.user.id, userAgent);
      this.refreshCookie.set(response, token);
    }

    return auth;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponse> {
    this.refreshTokens.assertEnabled();

    const rawToken = this.refreshCookie.read(request);
    if (!rawToken) {
      throw unauthorized(AuthErrorCode.RefreshTokenMissing, 'Refresh token no proporcionado');
    }

    const { userId, token } = await this.refreshTokens.rotate(rawToken, userAgent);
    const auth = await this.authService.createSessionForUser(userId);
    this.refreshCookie.set(response, token);
    return auth;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const rawToken = this.refreshCookie.read(request);
    if (rawToken) {
      await this.refreshTokens.revokeFamilyOf(rawToken);
    }
    this.refreshCookie.clear(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.getProfile(user.sub);
  }
}
