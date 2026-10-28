import { describe, expect, it, vi } from 'vitest';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

describe('ActivityController', () => {
  const mockActivityService = {
    recordSteps: vi.fn(),
    getStepsHistory: vi.fn(),
    registerExercise: vi.fn(),
    getExerciseHistory: vi.fn(),
    deleteExercise: vi.fn(),
    getActivitySummary: vi.fn(),
    updateGoals: vi.fn(),
  };

  const controller = new ActivityController(
    mockActivityService as unknown as ActivityService,
  );

  const mockUser = { sub: 'user-123', email: 'test@example.com' };

  it('should call activityService.recordSteps with userId and dto', async () => {
    const mockDto = { steps: 8500, localDate: '2026-10-28' };
    const mockResult = {
      id: 'step-1',
      localDate: '2026-10-28',
      steps: 8500,
      goal: 10000,
      progressPct: 85,
      updatedAt: '2026-10-28T20:00:00.000Z',
      healthDay: { id: 'day-1', localDate: '2026-10-28' },
    };

    mockActivityService.recordSteps.mockResolvedValue(mockResult);

    const result = await controller.recordSteps(mockUser, mockDto);

    expect(mockActivityService.recordSteps).toHaveBeenCalledWith('user-123', mockDto);
    expect(result).toEqual(mockResult);
  });

  it('should call activityService.getStepsHistory with userId and query', async () => {
    const mockQuery = { limit: 14, startDate: '2026-10-15', endDate: '2026-10-28' };
    const mockResult = {
      items: [
        {
          localDate: '2026-10-28',
          steps: 8500,
          goal: 10000,
          progressPct: 85,
          completed: false,
        },
      ],
      averageSteps: 8500,
      totalSteps: 8500,
      daysCount: 1,
    };

    mockActivityService.getStepsHistory.mockResolvedValue(mockResult);

    const result = await controller.getStepsHistory(mockUser, mockQuery);

    expect(mockActivityService.getStepsHistory).toHaveBeenCalledWith('user-123', mockQuery);
    expect(result).toEqual(mockResult);
  });

  it('should call activityService.registerExercise with userId and dto', async () => {
    const mockDto = {
      exerciseType: 'walking' as const,
      durationMinutes: 30,
      intensity: 'moderate' as const,
      caloriesBurned: 150,
      notes: 'Caminata en el parque',
    };
    const mockResult = {
      id: 'ex-1',
      occurredAt: '2026-10-28T10:00:00.000Z',
      exerciseType: 'walking',
      durationMinutes: 30,
      intensity: 'moderate',
      caloriesBurned: 150,
      notes: 'Caminata en el parque',
      createdAt: '2026-10-28T10:30:00.000Z',
      healthDay: { id: 'day-1', localDate: '2026-10-28' },
    };

    mockActivityService.registerExercise.mockResolvedValue(mockResult);

    const result = await controller.registerExercise(mockUser, mockDto);

    expect(mockActivityService.registerExercise).toHaveBeenCalledWith('user-123', mockDto);
    expect(result).toEqual(mockResult);
  });

  it('should call activityService.getExerciseHistory with userId and query', async () => {
    const mockQuery = { limit: 20, exerciseType: 'walking' };
    const mockList = [
      {
        id: 'ex-1',
        occurredAt: '2026-10-28T10:00:00.000Z',
        exerciseType: 'walking',
        durationMinutes: 30,
        intensity: 'moderate',
        caloriesBurned: 150,
        notes: null,
        createdAt: '2026-10-28T10:30:00.000Z',
        healthDay: { id: 'day-1', localDate: '2026-10-28' },
      },
    ];

    mockActivityService.getExerciseHistory.mockResolvedValue(mockList);

    const result = await controller.getExerciseHistory(mockUser, mockQuery);

    expect(mockActivityService.getExerciseHistory).toHaveBeenCalledWith('user-123', mockQuery);
    expect(result).toEqual(mockList);
  });

  it('should call activityService.deleteExercise with userId and id', async () => {
    mockActivityService.deleteExercise.mockResolvedValue(undefined);

    await controller.deleteExercise(mockUser, 'ex-uuid-1');

    expect(mockActivityService.deleteExercise).toHaveBeenCalledWith('user-123', 'ex-uuid-1');
  });

  it('should call activityService.getActivitySummary with userId', async () => {
    const mockSummary = {
      today: {
        localDate: '2026-10-28',
        steps: 8500,
        stepsGoal: 10000,
        stepsProgressPct: 85,
        exerciseMinutes: 45,
        exerciseSessionsCount: 1,
        hasActivityToday: true,
      },
      week: {
        weeklyAverageSteps: 8000,
        totalExerciseMinutes: 180,
        exerciseDaysCount: 4,
        daysMeetingGoalCount: 3,
      },
    };

    mockActivityService.getActivitySummary.mockResolvedValue(mockSummary);

    const result = await controller.getActivitySummary(mockUser);

    expect(mockActivityService.getActivitySummary).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockSummary);
  });

  it('should call activityService.updateGoals with userId and dto', async () => {
    const mockDto = { stepsGoal: 12000 };
    mockActivityService.updateGoals.mockResolvedValue({ stepsGoal: 12000 });

    const result = await controller.updateGoals(mockUser, mockDto);

    expect(mockActivityService.updateGoals).toHaveBeenCalledWith('user-123', mockDto);
    expect(result).toEqual({ stepsGoal: 12000 });
  });
});

