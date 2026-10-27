import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { NutritionService } from './nutrition.service.js';

describe('NutritionService', () => {
  let service: NutritionService;
  let prismaService: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    healthDay: {
      upsert: ReturnType<typeof vi.fn>;
    };
    mealEntry: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
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
      mealEntry: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new NutritionService(prismaService as unknown as PrismaService);
  });

  describe('registerMeal', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerMeal('non-existent-user', {
          mealType: 'lunch',
          description: 'Comida',
          hungerBefore: 5,
          satietyAfter: 6,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate localDate and upsert HealthDay correctly with provided occurredAt', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // In America/Mexico_City (UTC-6): 2026-10-27T04:00:00Z is 2026-10-26 22:00:00
      const occurredAtIso = '2026-10-27T04:00:00.000Z';
      const expectedLocalDate = new Date('2026-10-26T00:00:00.000Z');

      const mockHealthDay = {
        id: 'day-uuid-1',
        userId: mockUser.id,
        localDate: expectedLocalDate,
      };

      const mockCreatedMeal = {
        id: 'meal-uuid-1',
        healthDayId: mockHealthDay.id,
        mealType: 'dinner',
        occurredAt: new Date(occurredAtIso),
        description: 'Tacos ligeros',
        hungerBefore: 6,
        satietyAfter: 7,
        wantedMoreEvenIfFull: false,
        pausedBeforeMore: null,
        extraEatingContext: null,
        createdAt: new Date('2026-10-27T04:05:00.000Z'),
        healthDay: {
          id: mockHealthDay.id,
          localDate: expectedLocalDate,
        },
      };

      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);
      prismaService.mealEntry.create.mockResolvedValue(mockCreatedMeal);

      const result = await service.registerMeal(mockUser.id, {
        mealType: 'dinner',
        description: 'Tacos ligeros',
        hungerBefore: 6,
        satietyAfter: 7,
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

      expect(prismaService.mealEntry.create).toHaveBeenCalledWith({
        data: {
          healthDayId: mockHealthDay.id,
          mealType: 'dinner',
          occurredAt: new Date(occurredAtIso),
          description: 'Tacos ligeros',
          hungerBefore: 6,
          satietyAfter: 7,
          wantedMoreEvenIfFull: false,
          pausedBeforeMore: null,
          extraEatingContext: null,
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
        id: 'meal-uuid-1',
        occurredAt: occurredAtIso,
        mealType: 'dinner',
        description: 'Tacos ligeros',
        hungerBefore: 6,
        satietyAfter: 7,
        wantedMoreEvenIfFull: false,
        pausedBeforeMore: null,
        extraEatingContext: null,
        createdAt: '2026-10-27T04:05:00.000Z',
        healthDay: {
          id: 'day-uuid-1',
          localDate: '2026-10-26',
        },
      });
    });

    it('should save optional satiety and context fields when provided', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const occurredAtIso = '2026-10-27T18:00:00.000Z';
      const expectedLocalDate = new Date('2026-10-27T00:00:00.000Z');

      const mockHealthDay = {
        id: 'day-uuid-2',
        userId: mockUser.id,
        localDate: expectedLocalDate,
      };

      const mockCreatedMeal = {
        id: 'meal-uuid-2',
        healthDayId: mockHealthDay.id,
        mealType: 'lunch',
        occurredAt: new Date(occurredAtIso),
        description: 'Pollo y ensalada',
        hungerBefore: 7,
        satietyAfter: 8,
        wantedMoreEvenIfFull: true,
        pausedBeforeMore: true,
        extraEatingContext: 'Ganas de repetir por antojo',
        createdAt: new Date('2026-10-27T18:05:00.000Z'),
        healthDay: {
          id: mockHealthDay.id,
          localDate: expectedLocalDate,
        },
      };

      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);
      prismaService.mealEntry.create.mockResolvedValue(mockCreatedMeal);

      const result = await service.registerMeal(mockUser.id, {
        mealType: 'lunch',
        description: 'Pollo y ensalada',
        hungerBefore: 7,
        satietyAfter: 8,
        wantedMoreEvenIfFull: true,
        pausedBeforeMore: true,
        extraEatingContext: 'Ganas de repetir por antojo',
        occurredAt: occurredAtIso,
      });

      expect(prismaService.mealEntry.create).toHaveBeenCalledWith({
        data: {
          healthDayId: mockHealthDay.id,
          mealType: 'lunch',
          occurredAt: new Date(occurredAtIso),
          description: 'Pollo y ensalada',
          hungerBefore: 7,
          satietyAfter: 8,
          wantedMoreEvenIfFull: true,
          pausedBeforeMore: true,
          extraEatingContext: 'Ganas de repetir por antojo',
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

      expect(result.wantedMoreEvenIfFull).toBe(true);
      expect(result.pausedBeforeMore).toBe(true);
      expect(result.extraEatingContext).toBe('Ganas de repetir por antojo');
    });
  });

  describe('getMealHistory', () => {
    it('should return meals ordered by occurredAt desc with default limit', async () => {
      const mockMeals = [
        {
          id: 'meal-1',
          mealType: 'snack',
          occurredAt: new Date('2026-10-27T16:00:00.000Z'),
          description: 'Manzana con almendras',
          hungerBefore: 4,
          satietyAfter: 5,
          wantedMoreEvenIfFull: false,
          pausedBeforeMore: null,
          extraEatingContext: null,
          createdAt: new Date('2026-10-27T16:05:00.000Z'),
          healthDay: {
            id: 'day-1',
            localDate: new Date('2026-10-27T00:00:00.000Z'),
          },
        },
      ];

      prismaService.mealEntry.findMany.mockResolvedValue(mockMeals);

      const result = await service.getMealHistory(mockUser.id, {});

      expect(prismaService.mealEntry.findMany).toHaveBeenCalledWith({
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

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('meal-1');
      expect(result[0].mealType).toBe('snack');
    });

    it('should filter by localDate and mealType when provided', async () => {
      prismaService.mealEntry.findMany.mockResolvedValue([]);

      await service.getMealHistory(mockUser.id, {
        localDate: '2026-10-27',
        mealType: 'breakfast',
        limit: 10,
      });

      expect(prismaService.mealEntry.findMany).toHaveBeenCalledWith({
        where: {
          healthDay: {
            userId: mockUser.id,
            localDate: new Date('2026-10-27T00:00:00.000Z'),
          },
          mealType: 'breakfast',
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
        take: 10,
      });
    });
  });

  describe('deleteMeal', () => {
    it('should throw NotFoundException if meal does not exist or does not belong to user', async () => {
      prismaService.mealEntry.findFirst.mockResolvedValue(null);

      await expect(service.deleteMeal(mockUser.id, 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.mealEntry.delete).not.toHaveBeenCalled();
    });

    it('should delete meal when found', async () => {
      prismaService.mealEntry.findFirst.mockResolvedValue({ id: 'meal-1' });
      prismaService.mealEntry.delete.mockResolvedValue({ id: 'meal-1' });

      await service.deleteMeal(mockUser.id, 'meal-1');

      expect(prismaService.mealEntry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'meal-1',
          healthDay: {
            userId: mockUser.id,
          },
        },
      });
      expect(prismaService.mealEntry.delete).toHaveBeenCalledWith({
        where: { id: 'meal-1' },
      });
    });
  });
});
