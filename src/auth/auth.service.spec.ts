import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    authIdentity: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
  };
  let configService: {
    getOrThrow: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  const mockGooglePayload = {
    sub: 'google-sub-12345',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    name: 'Test User',
    timezone: 'America/Mexico_City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    configService = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'mock-client-id';
        if (key === 'JWT_SECRET') return 'mock-secret';
        throw new Error(`Unexpected key: ${key}`);
      }),
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return defaultValue;
      }),
    };

    prismaService = {
      authIdentity: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-jwt-token'),
    };

    service = new AuthService(
      configService as unknown as ConfigService,
      prismaService as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  describe('verifyGoogleToken', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      vi.spyOn(service['oauth2Client'], 'verifyIdToken').mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyGoogleToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if payload is missing email or sub', async () => {
      vi.spyOn(service['oauth2Client'], 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ email: undefined, sub: undefined }),
      } as never);

      await expect(service.verifyGoogleToken('incomplete-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return payload when token is valid', async () => {
      vi.spyOn(service['oauth2Client'], 'verifyIdToken').mockResolvedValue({
        getPayload: () => mockGooglePayload,
      } as never);

      const result = await service.verifyGoogleToken('valid-token');
      expect(result).toEqual(mockGooglePayload);
    });
  });

  describe('loginWithGoogle', () => {
    beforeEach(() => {
      vi.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGooglePayload as never);
    });

    it('should authenticate existing user with linked google identity', async () => {
      prismaService.authIdentity.findUnique.mockResolvedValue({
        id: 'identity-1',
        userId: mockUser.id,
        provider: 'google',
        providerSubject: mockGooglePayload.sub,
        user: mockUser,
      });

      const response = await service.loginWithGoogle('valid-token');

      expect(response.accessToken).toBe('signed-jwt-token');
      expect(response.tokenType).toBe('Bearer');
      expect(response.user.id).toBe(mockUser.id);
      expect(response.user.email).toBe(mockUser.email);
    });

    it('should link identity to existing user when email matches', async () => {
      prismaService.authIdentity.findUnique.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.authIdentity.create.mockResolvedValue({
        id: 'new-identity',
        userId: mockUser.id,
        provider: 'google',
        providerSubject: mockGooglePayload.sub,
      });

      const response = await service.loginWithGoogle('valid-token');

      expect(prismaService.authIdentity.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          provider: 'google',
          providerSubject: mockGooglePayload.sub,
        },
      });
      expect(response.user.id).toBe(mockUser.id);
    });

    it('should create new user and identity if user does not exist', async () => {
      prismaService.authIdentity.findUnique.mockResolvedValue(null);
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);

      const response = await service.loginWithGoogle('valid-token');

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: mockGooglePayload.email,
          name: mockGooglePayload.name,
          authIdentities: {
            create: {
              provider: 'google',
              providerSubject: mockGooglePayload.sub,
            },
          },
        },
      });
      expect(response.user.id).toBe(mockUser.id);
    });
  });

  describe('getProfile', () => {
    it('should return profile for valid user id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const profile = await service.getProfile(mockUser.id);
      expect(profile).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        timezone: mockUser.timezone,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
