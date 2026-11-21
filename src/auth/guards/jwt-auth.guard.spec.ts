import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let configService: { getOrThrow: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    jwtService = { verifyAsync: vi.fn() };
    configService = {
      getOrThrow: vi.fn().mockReturnValue('test-secret'),
    };
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  const createMockContext = (authHeader?: string) => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw UnauthorizedException when no authorization header is provided', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when header does not start with Bearer', async () => {
    const context = createMockContext('Basic 12345');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));
    const context = createMockContext('Bearer invalid-token');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should report ACCESS_TOKEN_EXPIRED when the token is expired', async () => {
    const expired = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    jwtService.verifyAsync.mockRejectedValue(expired);
    const context = createMockContext('Bearer expired-token');

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        code: 'ACCESS_TOKEN_EXPIRED',
        message: 'Token de autorización inválido o expirado',
      },
    });
  });

  it('should report ACCESS_TOKEN_INVALID when the token is malformed', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    const context = createMockContext('Bearer bad-token');

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { code: 'ACCESS_TOKEN_INVALID' },
    });
  });

  it('should attach payload to request and return true on valid token', async () => {
    const mockPayload = { sub: 'user-123', email: 'user@test.com' };
    jwtService.verifyAsync.mockResolvedValue(mockPayload);

    const context = createMockContext('Bearer valid-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(mockPayload);
  });
});
