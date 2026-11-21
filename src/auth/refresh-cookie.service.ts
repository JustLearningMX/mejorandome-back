import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import type { IssuedRefreshToken } from './interfaces/auth.interface.js';

export const REFRESH_COOKIE_NAME = 'mejorandome_rt';

@Injectable()
export class RefreshCookieService {
  private readonly baseOptions: CookieOptions;

  constructor(configService: ConfigService) {
    this.baseOptions = {
      httpOnly: true,
      secure: configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: configService.get<string>('REFRESH_COOKIE_PATH', '/api/auth'),
    };
  }

  set(response: Response, token: IssuedRefreshToken): void {
    response.cookie(REFRESH_COOKIE_NAME, token.value, {
      ...this.baseOptions,
      expires: token.expiresAt,
    });
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.baseOptions);
  }

  read(request: Request): string | undefined {
    const value = (request.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE_NAME];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
