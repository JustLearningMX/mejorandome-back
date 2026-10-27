import { describe, expect, it, vi } from 'vitest';
import { NutritionController } from './nutrition.controller.js';
import { NutritionService } from './nutrition.service.js';

describe('NutritionController', () => {
  const mockNutritionService = {
    registerMeal: vi.fn(),
    getMealHistory: vi.fn(),
    deleteMeal: vi.fn(),
  };

  const controller = new NutritionController(
    mockNutritionService as unknown as NutritionService,
  );

  const mockUser = { sub: 'user-123', email: 'test@example.com' };

  it('should call nutritionService.registerMeal with userId and dto', async () => {
    const mockDto = {
      mealType: 'lunch' as const,
      description: 'Pollo con arroz y ensalada',
      hungerBefore: 7,
      satietyAfter: 8,
      wantedMoreEvenIfFull: true,
      pausedBeforeMore: true,
      extraEatingContext: 'Antojo de más arroz',
    };

    const mockResult = {
      id: 'meal-1',
      occurredAt: '2026-10-27T13:30:00.000Z',
      mealType: 'lunch' as const,
      description: mockDto.description,
      hungerBefore: 7,
      satietyAfter: 8,
      wantedMoreEvenIfFull: true,
      pausedBeforeMore: true,
      extraEatingContext: 'Antojo de más arroz',
      createdAt: '2026-10-27T13:35:00.000Z',
      healthDay: {
        id: 'day-1',
        localDate: '2026-10-27',
      },
    };

    mockNutritionService.registerMeal.mockResolvedValue(mockResult);

    const result = await controller.registerMeal(mockUser, mockDto);

    expect(mockNutritionService.registerMeal).toHaveBeenCalledWith(
      'user-123',
      mockDto,
    );
    expect(result).toEqual(mockResult);
  });

  it('should call nutritionService.getMealHistory with userId and query', async () => {
    const mockQuery = { limit: 10, localDate: '2026-10-27', mealType: 'lunch' as const };
    const mockList = [
      {
        id: 'meal-1',
        occurredAt: '2026-10-27T13:30:00.000Z',
        mealType: 'lunch' as const,
        description: 'Pollo con arroz',
        hungerBefore: 7,
        satietyAfter: 8,
        wantedMoreEvenIfFull: false,
        pausedBeforeMore: null,
        extraEatingContext: null,
        createdAt: '2026-10-27T13:35:00.000Z',
        healthDay: {
          id: 'day-1',
          localDate: '2026-10-27',
        },
      },
    ];

    mockNutritionService.getMealHistory.mockResolvedValue(mockList);

    const result = await controller.getMealHistory(mockUser, mockQuery);

    expect(mockNutritionService.getMealHistory).toHaveBeenCalledWith(
      'user-123',
      mockQuery,
    );
    expect(result).toEqual(mockList);
  });

  it('should call nutritionService.deleteMeal with userId and id', async () => {
    mockNutritionService.deleteMeal.mockResolvedValue(undefined);

    await controller.deleteMeal(mockUser, 'meal-123');

    expect(mockNutritionService.deleteMeal).toHaveBeenCalledWith(
      'user-123',
      'meal-123',
    );
  });
});
