import { UnauthorizedException } from '@nestjs/common';

export enum AuthErrorCode {
  AccessTokenInvalid = 'ACCESS_TOKEN_INVALID',
  AccessTokenExpired = 'ACCESS_TOKEN_EXPIRED',
  RefreshTokenMissing = 'REFRESH_TOKEN_MISSING',
  RefreshTokenInvalid = 'REFRESH_TOKEN_INVALID',
  RefreshTokenReused = 'REFRESH_TOKEN_REUSED',
}

export function unauthorized(code: AuthErrorCode, message: string): UnauthorizedException {
  return new UnauthorizedException({
    statusCode: 401,
    message,
    error: 'Unauthorized',
    code,
  });
}
