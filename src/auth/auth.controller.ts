import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthResponse, AuthenticatedUser, JwtPayload } from './interfaces/auth.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: GoogleLoginDto): Promise<AuthResponse> {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.getProfile(user.sub);
  }
}
