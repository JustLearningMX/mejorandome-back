import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { REFRESH_COOKIE_NAME, RefreshCookieService } from './refresh-cookie.service.js';

describe('RefreshCookieService', () => {
  const build = (env: Record<string, string>) =>
    new RefreshCookieService({
      get: vi.fn((key: string, fallback?: string) => env[key] ?? fallback),
    } as unknown as ConfigService);

  const token = { id: 'rt-1', value: 'raw', expiresAt: new Date('2026-12-21T00:00:00Z') };

  it('should set a strict httpOnly cookie scoped to the configured path', () => {
    const cookie = vi.fn();
    const response = { cookie } as unknown as Response;

    build({ NODE_ENV: 'production', REFRESH_COOKIE_PATH: '/mejorandome-back/v1/api/auth' }).set(
      response,
      token,
    );

    expect(cookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, 'raw', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/mejorandome-back/v1/api/auth',
      expires: token.expiresAt,
    });
  });

  it('should not require Secure outside production', () => {
    const cookie = vi.fn();
    const response = { cookie } as unknown as Response;

    build({ NODE_ENV: 'development' }).set(response, token);

    expect(cookie.mock.calls[0][2]).toMatchObject({
      secure: false,
      path: '/api/auth',
    });
  });

  it('should clear the cookie with the same path attributes', () => {
    const clearCookie = vi.fn();
    const response = { clearCookie } as unknown as Response;

    build({ NODE_ENV: 'production' }).clear(response);

    expect(clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
    );
  });

  it('should read the cookie value and ignore missing or empty values', () => {
    const service = build({});
    const withCookie = { cookies: { [REFRESH_COOKIE_NAME]: 'raw' } } as unknown as Request;
    const empty = { cookies: { [REFRESH_COOKIE_NAME]: '' } } as unknown as Request;
    const noParser = {} as unknown as Request;

    expect(service.read(withCookie)).toBe('raw');
    expect(service.read(empty)).toBeUndefined();
    expect(service.read(noParser)).toBeUndefined();
  });
});
