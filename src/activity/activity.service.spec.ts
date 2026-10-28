import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityService } from './activity.service.js';

describe('ActivityService', () => {
  let service: ActivityService;
  let prismaService: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    healthDay: {
      upsert: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    dailyActivity: {
      upsert: ReturnType<typeof vi.fn>;
    };
    exerciseSession: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  const mockUser = {
    id: 'user-uuid-1',
    timezone: 'America/Mexico_City',
    stepsGoal: 10000,
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      healthDay: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      dailyActivity: {
        upsert: vi.fn(),
      },
      exerciseSession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new ActivityService(prismaService as unknown as PrismaService);
  });

  describe('recordSteps', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.recordSteps('non-existent-user', { steps: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert HealthDay and DailyActivity with explicit localDate', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const mockHealthDay = {
        id: 'day-1',
        userId: mockUser.id,
        localDate: new Date('2026-10-28T00:00:00.000Z'),
      };
      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);

      const mockDailyActivity = {
        id: 'activity-1',
        healthDayId: mockHealthDay.id,
        steps: 8450,
        source: 'manual',
        recordedAt: new Date('2026-10-28T12:00:00.000Z'),
        updatedAt: new Date('2026-10-28T12:00:00.000Z'),
      };
      prismaService.dailyActivity.upsert.mockResolvedValue(mockDailyActivity);

      const result = await service.recordSteps(mockUser.id, {
        steps: 8450,
        localDate: '2026-10-28',
      });

      expect(prismaService.healthDay.upsert).toHaveBeenCalledWith({
        where: {
          userId_localDate: {
            userId: mockUser.id,
            localDate: new Date('2026-10-28T00:00:00.000Z'),
          },
        },
        update: {},
        create: {
          userId: mockUser.id,
          localDate: new Date('2026-10-28T00:00:00.000Z'),
        },
      });

      expect(prismaService.dailyActivity.upsert).toHaveBeenCalledWith({
        where: { healthDayId: mockHealthDay.id },
        update: {
          steps: 8450,
          recordedAt: expect.any(Date),
        },
        create: {
          healthDayId: mockHealthDay.id,
          steps: 8450,
          source: 'manual',
          recordedAt: expect.any(Date),
        },
      });

      expect(result).toEqual({
        id: 'activity-1',
        localDate: '2026-10-28',
        steps: 8450,
        goal: 10000,
        progressPct: 84.5,
        updatedAt: mockDailyActivity.updatedAt.toISOString(),
        healthDay: {
          id: 'day-1',
          localDate: '2026-10-28',
        },
      });
    });

    it('should calculate localDate from occurredAt using user timezone', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // In America/Mexico_City (UTC-6): 2026-10-28T04:00:00Z is 2026-10-27 22:00:00
      const occurredAt = '2026-10-28T04:00:00.000Z';
      const expectedLocalDate = new Date('2026-10-27T00:00:00.000Z');

      const mockHealthDay = {
        id: 'day-2',
        userId: mockUser.id,
        localDate: expectedLocalDate,
      };
      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);

      const mockDailyActivity = {
        id: 'activity-2',
        healthDayId: mockHealthDay.id,
        steps: 10000,
        source: 'manual',
        recordedAt: new Date(occurredAt),
        updatedAt: new Date('2026-10-28T04:00:00.000Z'),
      };
      prismaService.dailyActivity.upsert.mockResolvedValue(mockDailyActivity);

      const result = await service.recordSteps(mockUser.id, {
        steps: 10000,
        occurredAt,
      });

      expect(result.localDate).toBe('2026-10-27');
      expect(result.progressPct).toBe(100);
    });
  });

  describe('getStepsHistory', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getStepsHistory('non-existent-user', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return step history and calculate averages correctly', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const mockHealthDays = [
        {
          id: 'day-1',
          localDate: new Date('2026-10-28T00:00:00.000Z'),
          dailyActivity: { steps: 12000 },
        },
        {
          id: 'day-2',
          localDate: new Date('2026-10-27T00:00:00.000Z'),
          dailyActivity: { steps: 8000 },
        },
      ];
      prismaService.healthDay.findMany.mockResolvedValue(mockHealthDays);

      const result = await service.getStepsHistory(mockUser.id, {
        startDate: '2026-10-27',
        endDate: '2026-10-28',
      });

      expect(result.daysCount).toBe(2);
      expect(result.totalSteps).toBe(20000);
      expect(result.averageSteps).toBe(10000);
      expect(result.items).toEqual([
        {
          localDate: '2026-10-28',
          steps: 12000,
          goal: 10000,
          progressPct: 120,
          completed: true,
        },
        {
          localDate: '2026-10-27',
          steps: 8000,
          goal: 10000,
          progressPct: 80,
          completed: false,
        },
      ]);
    });

    it('should handle empty results gracefully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.healthDay.findMany.mockResolvedValue([]);

      const result = await service.getStepsHistory(mockUser.id, {});

      expect(result.daysCount).toBe(0);
      expect(result.totalSteps).toBe(0);
      expect(result.averageSteps).toBe(0);
      expect(result.items).toEqual([]);
    });
  });

  describe('registerExercise', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerExercise('non-existent-user', {
          exerciseType: 'running',
          durationMinutes: 30,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create ExerciseSession and link to HealthDay', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const mockHealthDay = {
        id: 'day-1',
        userId: mockUser.id,
        localDate: new Date('2026-10-28T00:00:00.000Z'),
      };
      prismaService.healthDay.upsert.mockResolvedValue(mockHealthDay);

      const occurredAt = new Date('2026-10-28T18:00:00.000Z');
      const mockCreatedExercise = {
        id: 'ex-1',
        healthDayId: mockHealthDay.id,
        exerciseType: 'strength_training',
        durationMinutes: 45,
        intensity: 'moderate',
        caloriesBurned: 220,
        occurredAt,
        notes: 'Rutina torso superior',
        createdAt: new Date('2026-10-28T18:50:00.000Z'),
        healthDay: {
          id: mockHealthDay.id,
          localDate: mockHealthDay.localDate,
        },
      };
      prismaService.exerciseSession.create.mockResolvedValue(mockCreatedExercise);

      const result = await service.registerExercise(mockUser.id, {
        exerciseType: 'strength_training',
        durationMinutes: 45,
        intensity: 'moderate',
        caloriesBurned: 220,
        occurredAt: '2026-10-28T18:00:00.000Z',
        notes: 'Rutina torso superior',
      });

      expect(prismaService.exerciseSession.create).toHaveBeenCalledWith({
        data: {
          healthDayId: mockHealthDay.id,
          exerciseType: 'strength_training',
          durationMinutes: 45,
          intensity: 'moderate',
          caloriesBurned: 220,
          occurredAt,
          notes: 'Rutina torso superior',
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
        id: 'ex-1',
        occurredAt: '2026-10-28T18:00:00.000Z',
        exerciseType: 'strength_training',
        durationMinutes: 45,
        intensity: 'moderate',
        caloriesBurned: 220,
        notes: 'Rutina torso superior',
        createdAt: '2026-10-28T18:50:00.000Z',
        healthDay: {
          id: mockHealthDay.id,
          localDate: '2026-10-28',
        },
      });
    });
  });

  describe('getExerciseHistory', () => {
    it('should return list of exercises with filters applied', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseType: 'running',
          durationMinutes: 40,
          intensity: 'vigorous',
          caloriesBurned: 350,
          notes: '5km',
          occurredAt: new Date('2026-10-28T07:00:00.000Z'),
          createdAt: new Date('2026-10-28T07:45:00.000Z'),
          healthDay: {
            id: 'day-1',
            localDate: new Date('2026-10-28T00:00:00.000Z'),
          },
        },
      ];
      prismaService.exerciseSession.findMany.mockResolvedValue(mockExercises);

      const result = await service.getExerciseHistory(mockUser.id, {
        limit: 10,
        exerciseType: 'running',
        localDate: '2026-10-28',
      });

      expect(prismaService.exerciseSession.findMany).toHaveBeenCalledWith({
        where: {
          healthDay: {
            userId: mockUser.id,
            localDate: new Date('2026-10-28T00:00:00.000Z'),
          },
          exerciseType: 'running',
        },
        include: {
          healthDay: {
            select: {
              id: true,
              localDate: true,
            },
          },
        },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].exerciseType).toBe('running');
    });
  });

  describe('deleteExercise', () => {
    it('should throw NotFoundException if exercise not found or belongs to another user', async () => {
      prismaService.exerciseSession.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteExercise(mockUser.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete exercise successfully', async () => {
      prismaService.exerciseSession.findFirst.mockResolvedValue({ id: 'ex-1' });
      prismaService.exerciseSession.delete.mockResolvedValue({ id: 'ex-1' });

      await service.deleteExercise(mockUser.id, 'ex-1');

      expect(prismaService.exerciseSession.delete).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
      });
    });
  });

  describe('updateGoals', () => {
    it('should update user stepsGoal and return updated value', async () => {
      prismaService.user.update.mockResolvedValue({ stepsGoal: 12000 });

      const result = await service.updateGoals(mockUser.id, { stepsGoal: 12000 });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { stepsGoal: 12000 },
        select: { stepsGoal: true },
      });
      expect(result).toEqual({ stepsGoal: 12000 });
    });
  });

  describe('getActivitySummary', () => {
    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getActivitySummary('non-existent-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return complete summary with today metrics and weekly aggregates', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Current local date in America/Mexico_City
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const todayStr = formatter.format(new Date());

      const mockHealthDays = [
        {
          id: 'day-today',
          localDate: new Date(`${todayStr}T00:00:00.000Z`),
          dailyActivity: { steps: 8450 },
          exerciseSessions: [
            { durationMinutes: 45 },
          ],
        },
        {
          id: 'day-yesterday',
          localDate: new Date('2026-10-27T00:00:00.000Z'),
          dailyActivity: { steps: 11000 },
          exerciseSessions: [
            { durationMinutes: 30 },
          ],
        },
      ];
      prismaService.healthDay.findMany.mockResolvedValue(mockHealthDays);

      const result = await service.getActivitySummary(mockUser.id);

      expect(result.today.steps).toBe(8450);
      expect(result.today.stepsGoal).toBe(10000);
      expect(result.today.stepsProgressPct).toBe(84.5);
      expect(result.today.exerciseMinutes).toBe(45);
      expect(result.today.exerciseSessionsCount).toBe(1);
      expect(result.today.hasActivityToday).toBe(true);

      expect(result.week.totalExerciseMinutes).toBe(75);
      expect(result.week.exerciseDaysCount).toBe(2);
      expect(result.week.weeklyAverageSteps).toBe(9725);
      expect(result.week.daysMeetingGoalCount).toBe(1); // 11000 >= 10000
    });
  });
});

