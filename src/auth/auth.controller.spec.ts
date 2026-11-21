import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshCookieService } from './refresh-cookie.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

describe('AuthController', () => {
  const mockAuthService = {
    loginWithGoogle: vi.fn(),
    createSessionForUser: vi.fn(),
    getProfile: vi.fn(),
  };
  const mockRefreshTokens = {
    enabled: false,
    assertEnabled: vi.fn(),
    issue: vi.fn(),
    rotate: vi.fn(),
    revokeFamilyOf: vi.fn(),
  };
  const mockRefreshCookie = {
    set: vi.fn(),
    clear: vi.fn(),
    read: vi.fn(),
  };

  const controller = new AuthController(
    mockAuthService as unknown as AuthService,
    mockRefreshTokens as unknown as RefreshTokenService,
    mockRefreshCookie as unknown as RefreshCookieService,
  );

  const response = {} as Response;
  const request = {} as Request;
  const authResponse = {
    accessToken: 'token-123',
    tokenType: 'Bearer',
    expiresIn: '7d',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      timezone: 'America/Mexico_City',
    },
  };
  const issuedToken = { id: 'rt-1', value: 'raw-refresh', expiresAt: new Date() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshTokens.enabled = false;
  });

  it('should return the session without cookie when refresh is disabled', async () => {
    mockAuthService.loginWithGoogle.mockResolvedValue(authResponse);

    const result = await controller.googleLogin({ idToken: 'google-token' }, response, 'agent');

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith('google-token');
    expect(result).toEqual(authResponse);
    expect(mockRefreshTokens.issue).not.toHaveBeenCalled();
    expect(mockRefreshCookie.set).not.toHaveBeenCalled();
  });

  it('should issue the refresh cookie on login when refresh is enabled', async () => {
    mockRefreshTokens.enabled = true;
    mockAuthService.loginWithGoogle.mockResolvedValue(authResponse);
    mockRefreshTokens.issue.mockResolvedValue(issuedToken);

    const result = await controller.googleLogin({ idToken: 'google-token' }, response, 'agent');

    expect(mockRefreshTokens.issue).toHaveBeenCalledWith('user-1', 'agent');
    expect(mockRefreshCookie.set).toHaveBeenCalledWith(response, issuedToken);
    expect(result).toEqual(authResponse);
  });

  it('should rotate the refresh token and return a new session', async () => {
    mockRefreshCookie.read.mockReturnValue('old-raw');
    mockRefreshTokens.rotate.mockResolvedValue({ userId: 'user-1', token: issuedToken });
    mockAuthService.createSessionForUser.mockResolvedValue(authResponse);

    const result = await controller.refresh(request, response, 'agent');

    expect(mockRefreshTokens.assertEnabled).toHaveBeenCalled();
    expect(mockRefreshTokens.rotate).toHaveBeenCalledWith('old-raw', 'agent');
    expect(mockAuthService.createSessionForUser).toHaveBeenCalledWith('user-1');
    expect(mockRefreshCookie.set).toHaveBeenCalledWith(response, issuedToken);
    expect(result).toEqual(authResponse);
  });

  it('should reject refresh with REFRESH_TOKEN_MISSING when there is no cookie', async () => {
    mockRefreshCookie.read.mockReturnValue(undefined);

    await expect(controller.refresh(request, response)).rejects.toMatchObject({
      response: { code: 'REFRESH_TOKEN_MISSING' },
    });
    expect(mockRefreshTokens.rotate).not.toHaveBeenCalled();
  });

  it('should revoke the family and clear the cookie on logout', async () => {
    mockRefreshCookie.read.mockReturnValue('raw');

    await controller.logout(request, response);

    expect(mockRefreshTokens.revokeFamilyOf).toHaveBeenCalledWith('raw');
    expect(mockRefreshCookie.clear).toHaveBeenCalledWith(response);
  });

  it('should clear the cookie on logout even without a refresh token', async () => {
    mockRefreshCookie.read.mockReturnValue(undefined);

    await controller.logout(request, response);

    expect(mockRefreshTokens.revokeFamilyOf).not.toHaveBeenCalled();
    expect(mockRefreshCookie.clear).toHaveBeenCalledWith(response);
  });

  it('should call authService.getProfile and return result', async () => {
    const mockProfile = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      timezone: 'America/Mexico_City',
    };
    mockAuthService.getProfile.mockResolvedValue(mockProfile);

    const result = await controller.getProfile({ sub: 'user-1', email: 'test@example.com' });
    expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockProfile);
  });
});
