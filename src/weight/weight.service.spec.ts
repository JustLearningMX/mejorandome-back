import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { WeightService } from './weight.service.js';

describe('WeightService', () => {
  let service: WeightService;
  let prismaService: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    healthDay: {
      upsert: ReturnType<typeof vi.fn>;
    };
    weightMeasurement: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  const mockUser = {
    id: 'user-uuid-1',
    timezone: 'America/Mexico_City',
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      healthDay: {
        upsert: vi.fn(),
      },
      weightMeasurement: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    service = new WeightService(prismaService as unknown as PrismaService);
  });

  describe('registerWeight', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerWeight('non-existent-user', { weightKg: 80.5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate localDate and upsert HealthDay correctly with provided occurredAt', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // In America/Mexico_City (UTC-6): 2026-10-24T04:00:00Z is 2026-10-23 22:00:00
      const occurredAtIso = '2026-10-24T04:00:00.000Z';
      const expectedLocalDate = new Date('2026-10-23T00:00:00.000Z');

      const mockHealthDay = {
        id: 'day-uuid-1',
        userId: mockUser.id,
        localDate: expectedLocalDate,
      };

      const mockCreatedMeasurement = {
        id: 'measurement-uuid-1',
        healthDayId: mockHealthDay.id,
        weightKg: '80.50',
        occurredAt: new Date(occurredAtIso),
        createdAt: new Date('2026-10-24T04:00:05.000Z'),
        healthDay: {
          id: mockHealthDay.id,
          localDate: expectedLocalDate,
        },
      };

      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);
      prismaService.weightMeasurement.create.mockResolvedValue(mockCreatedMeasurement);

      const result = await service.registerWeight(mockUser.id, {
        weightKg: 80.5,
        occurredAt: occurredAtIso,
      });

      expect(prismaService.healthDay.upsert).toHaveBeenCalledWith({
        where: {
          userId_localDate: {
            userId: mockUser.id,
            localDate: expectedLocalDate,
          },
        },
        update: {},
        create: {
          userId: mockUser.id,
          localDate: expectedLocalDate,
        },
      });

      expect(prismaService.weightMeasurement.create).toHaveBeenCalledWith({
        data: {
          healthDayId: mockHealthDay.id,
          weightKg: 80.5,
          occurredAt: new Date(occurredAtIso),
        },
        include: {
          healthDay: {
            select: {
              id: true,
              localDate: true,
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'measurement-uuid-1',
        weightKg: 80.5,
        occurredAt: occurredAtIso,
        createdAt: '2026-10-24T04:00:05.000Z',
        healthDay: {
          id: 'day-uuid-1',
          localDate: '2026-10-23',
        },
      });
    });

    it('should default occurredAt to current time if omitted', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      const mockHealthDay = {
        id: 'day-uuid-1',
        userId: mockUser.id,
        localDate: new Date('2026-10-24T00:00:00.000Z'),
      };
      const now = new Date();
      const mockCreatedMeasurement = {
        id: 'measurement-uuid-2',
        healthDayId: mockHealthDay.id,
        weightKg: '75.00',
        occurredAt: now,
        createdAt: now,
        healthDay: {
          id: mockHealthDay.id,
          localDate: new Date('2026-10-24T00:00:00.000Z'),
        },
      };

      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);
      prismaService.weightMeasurement.create.mockResolvedValue(mockCreatedMeasurement);

      const result = await service.registerWeight(mockUser.id, { weightKg: 75 });

      expect(prismaService.healthDay.upsert).toHaveBeenCalled();
      expect(prismaService.weightMeasurement.create).toHaveBeenCalled();
      expect(result.weightKg).toBe(75);
      expect(result.id).toBe('measurement-uuid-2');
    });
  });

  describe('getWeightHistory', () => {
    it('should return mapped weight measurements with default limit of 30', async () => {
      const mockDate = new Date('2026-10-24T08:00:00.000Z');
      const mockLocalDate = new Date('2026-10-24T00:00:00.000Z');
      const mockMeasurements = [
        {
          id: 'm-1',
          weightKg: '82.30',
          occurredAt: mockDate,
          createdAt: mockDate,
          healthDay: {
            id: 'hd-1',
            localDate: mockLocalDate,
          },
        },
      ];

      prismaService.weightMeasurement.findMany.mockResolvedValue(mockMeasurements);

      const result = await service.getWeightHistory(mockUser.id, {});

      expect(prismaService.weightMeasurement.findMany).toHaveBeenCalledWith({
        where: {
          healthDay: {
            userId: mockUser.id,
          },
        },
        include: {
          healthDay: {
            select: {
              id: true,
              localDate: true,
            },
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 30,
      });

      expect(result).toEqual([
        {
          id: 'm-1',
          weightKg: 82.3,
          occurredAt: mockDate.toISOString(),
          createdAt: mockDate.toISOString(),
          healthDay: {
            id: 'hd-1',
            localDate: '2026-10-24',
          },
        },
      ]);
    });

    it('should respect custom limit', async () => {
      prismaService.weightMeasurement.findMany.mockResolvedValue([]);

      await service.getWeightHistory(mockUser.id, { limit: 5 });

      expect(prismaService.weightMeasurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });
});
