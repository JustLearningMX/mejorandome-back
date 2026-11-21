import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthErrorCode, unauthorized } from './auth-error.js';
import type { IssuedRefreshToken, RotatedRefreshToken } from './interfaces/auth.interface.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REUSE_GRACE_MS = 10_000;
const USER_AGENT_MAX_LENGTH = 255;

@Injectable()
export class RefreshTokenService {
  private readonly ttlMs: number;
  readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.enabled = configService.get<string>('REFRESH_TOKENS_ENABLED', 'false') === 'true';
    this.ttlMs = Number(configService.get<number>('REFRESH_TOKEN_TTL_DAYS', 30)) * DAY_MS;
  }

  assertEnabled(): void {
    if (!this.enabled) {
      throw new NotFoundException();
    }
  }

  async issue(userId: string, userAgent?: string): Promise<IssuedRefreshToken> {
    return this.create(userId, randomUUID(), userAgent);
  }

  async rotate(rawToken: string, userAgent?: string): Promise<RotatedRefreshToken> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });

    if (!current) {
      throw this.invalid();
    }

    if (current.revokedAt) {
      await this.handleRevokedToken(current);
    }

    if (current.expiresAt <= new Date()) {
      throw this.invalid();
    }

    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: current.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw this.invalid();
    }

    const next = await this.create(current.userId, current.familyId, userAgent);
    await this.prisma.refreshToken.update({
      where: { id: current.id },
      data: { replacedById: next.id },
    });

    return { userId: current.userId, token: next };
  }

  async revokeFamilyOf(rawToken: string): Promise<void> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (token) {
      await this.revokeFamily(token.familyId);
    }
  }

  private async handleRevokedToken(token: {
    familyId: string;
    revokedAt: Date | null;
    replacedById: string | null;
  }): Promise<never> {
    const wasRotated = token.replacedById !== null && token.revokedAt !== null;
    const withinGrace =
      wasRotated && Date.now() - token.revokedAt!.getTime() < REUSE_GRACE_MS;

    if (!wasRotated || withinGrace) {
      throw this.invalid();
    }

    await this.revokeFamily(token.familyId);
    throw unauthorized(
      AuthErrorCode.RefreshTokenReused,
      'Refresh token reutilizado: la sesión fue revocada',
    );
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async create(
    userId: string,
    familyId: string,
    userAgent?: string,
  ): Promise<IssuedRefreshToken> {
    const value = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const record = await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: this.hash(value),
        expiresAt,
        userAgent: userAgent?.slice(0, USER_AGENT_MAX_LENGTH),
      },
    });
    return { id: record.id, value, expiresAt };
  }

  private hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private invalid() {
    return unauthorized(
      AuthErrorCode.RefreshTokenInvalid,
      'Refresh token inválido, expirado o revocado',
    );
  }
}
