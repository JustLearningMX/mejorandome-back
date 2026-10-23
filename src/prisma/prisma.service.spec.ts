import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  it('should be defined', () => {
    const service = new PrismaService();
    expect(service).toBeDefined();
  });

  it('should call $connect on onModuleInit', async () => {
    const service = new PrismaService();
    const connectSpy = vi.spyOn(service, '$connect').mockResolvedValue(undefined as never);

    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should call $disconnect on onModuleDestroy', async () => {
    const service = new PrismaService();
    const disconnectSpy = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined as never);

    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
