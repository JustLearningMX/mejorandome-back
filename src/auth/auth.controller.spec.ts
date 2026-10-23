import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  const mockAuthService = {
    loginWithGoogle: vi.fn(),
    getProfile: vi.fn(),
  };

  const controller = new AuthController(mockAuthService as unknown as AuthService);

  it('should call authService.loginWithGoogle and return result', async () => {
    const mockResponse = {
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
    mockAuthService.loginWithGoogle.mockResolvedValue(mockResponse);

    const result = await controller.googleLogin({ idToken: 'google-token' });
    expect(mockAuthService.loginWithGoogle).toHaveBeenCalledWith('google-token');
    expect(result).toEqual(mockResponse);
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
