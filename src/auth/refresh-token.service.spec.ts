import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let refreshToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };

  const buildService = (env: Record<string, unknown>) =>
    new RefreshTokenService(
      { refreshToken } as unknown as PrismaService,
      {
        get: vi.fn((key: string, fallback?: unknown) => env[key] ?? fallback),
      } as unknown as ConfigService,
    );

  const storedToken = (overrides: Record<string, unknown> = {}) => ({
    id: 'rt-old',
    userId: 'user-1',
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    replacedById: null,
    ...overrides,
  });

  beforeEach(() => {
    refreshToken = {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'rt-new',
        ...data,
      })),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    service = buildService({ REFRESH_TOKENS_ENABLED: 'true', REFRESH_TOKEN_TTL_DAYS: 30 });
  });

  describe('enabled flag', () => {
    it('should be disabled by default and reject with 404', () => {
      const disabled = buildService({});
      expect(disabled.enabled).toBe(false);
      expect(() => disabled.assertEnabled()).toThrow(NotFoundException);
    });

    it('should be enabled when REFRESH_TOKENS_ENABLED is true', () => {
      expect(service.enabled).toBe(true);
      expect(() => service.assertEnabled()).not.toThrow();
    });
  });

  describe('issue', () => {
    it('should store only the SHA-256 hash of the opaque token', async () => {
      const issued = await service.issue('user-1', 'agent');

      const data = refreshToken.create.mock.calls[0][0].data;
      expect(data.tokenHash).toBe(sha256(issued.value));
      expect(data.tokenHash).not.toBe(issued.value);
      expect(data.userId).toBe('user-1');
      expect(data.userAgent).toBe('agent');
      expect(issued.value.length).toBeGreaterThanOrEqual(43);
    });

    it('should expire after the configured number of days', async () => {
      const issued = await service.issue('user-1');
      const expectedMs = 30 * 24 * 60 * 60 * 1000;
      const remaining = issued.expiresAt.getTime() - Date.now();
      expect(remaining).toBeGreaterThan(expectedMs - 5_000);
      expect(remaining).toBeLessThanOrEqual(expectedMs);
    });

    it('should truncate long user agents', async () => {
      await service.issue('user-1', 'x'.repeat(400));
      expect(refreshToken.create.mock.calls[0][0].data.userAgent).toHaveLength(255);
    });
  });

  describe('rotate', () => {
    it('should revoke the current token and issue a new one in the same family', async () => {
      refreshToken.findUnique.mockResolvedValue(storedToken());

      const result = await service.rotate('raw-old');

      expect(refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: sha256('raw-old') },
      });
      expect(refreshToken.create.mock.calls[0][0].data.familyId).toBe('family-1');
      expect(refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-old' },
        data: { replacedById: 'rt-new' },
      });
      expect(result.userId).toBe('user-1');
      expect(result.token.id).toBe('rt-new');
    });

    it('should reject unknown tokens as REFRESH_TOKEN_INVALID', async () => {
      refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotate('unknown')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_INVALID' },
      });
    });

    it('should reject expired tokens as REFRESH_TOKEN_INVALID', async () => {
      refreshToken.findUnique.mockResolvedValue(
        storedToken({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.rotate('raw')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_INVALID' },
      });
      expect(refreshToken.create).not.toHaveBeenCalled();
    });

    it('should reject tokens revoked by logout as INVALID without revoking more', async () => {
      refreshToken.findUnique.mockResolvedValue(
        storedToken({ revokedAt: new Date(Date.now() - 60_000), replacedById: null }),
      );

      await expect(service.rotate('raw')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_INVALID' },
      });
      expect(refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('should treat a just-rotated token as INVALID within the grace window', async () => {
      refreshToken.findUnique.mockResolvedValue(
        storedToken({ revokedAt: new Date(Date.now() - 2_000), replacedById: 'rt-new' }),
      );

      await expect(service.rotate('raw')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_INVALID' },
      });
      expect(refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('should revoke the whole family when a rotated token is reused after the grace window', async () => {
      refreshToken.findUnique.mockResolvedValue(
        storedToken({ revokedAt: new Date(Date.now() - 60_000), replacedById: 'rt-new' }),
      );

      await expect(service.rotate('raw')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_REUSED' },
      });
      expect(refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(refreshToken.create).not.toHaveBeenCalled();
    });

    it('should reject when a concurrent request already claimed the token', async () => {
      refreshToken.findUnique.mockResolvedValue(storedToken());
      refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.rotate('raw')).rejects.toMatchObject({
        response: { code: 'REFRESH_TOKEN_INVALID' },
      });
      expect(refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeFamilyOf', () => {
    it('should revoke every active token of the family', async () => {
      refreshToken.findUnique.mockResolvedValue(storedToken());

      await service.revokeFamilyOf('raw');

      expect(refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should do nothing for unknown tokens', async () => {
      refreshToken.findUnique.mockResolvedValue(null);

      await service.revokeFamilyOf('unknown');

      expect(refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
