import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  it('should return health status ok when db is reachable', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;

    const service = new HealthService(mockPrisma);
    const controller = new HealthController(service);

    const response = await controller.check();

    expect(response.status).toBe('ok');
    expect(response.db).toBe('ok');
    expect(typeof response.timestamp).toBe('string');
    expect(typeof response.uptime).toBe('number');
  });

  it('should return degraded status when db is unreachable', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Connection lost')),
    } as unknown as PrismaService;

    const service = new HealthService(mockPrisma);
    const controller = new HealthController(service);

    const response = await controller.check();

    expect(response.status).toBe('degraded');
    expect(response.db).toBe('error');
  });
});
