import { describe, expect, it, vi } from 'vitest';
import { WeightController } from './weight.controller.js';
import { WeightService } from './weight.service.js';

describe('WeightController', () => {
  const mockWeightService = {
    registerWeight: vi.fn(),
    getWeightHistory: vi.fn(),
  };

  const controller = new WeightController(mockWeightService as unknown as WeightService);

  it('should call weightService.registerWeight with userId and dto', async () => {
    const mockUser = { sub: 'user-123', email: 'test@example.com' };
    const mockDto = { weightKg: 85.2, occurredAt: '2026-10-24T08:00:00.000Z' };
    const mockResult = {
      id: 'weight-1',
      weightKg: 85.2,
      occurredAt: '2026-10-24T08:00:00.000Z',
      createdAt: '2026-10-24T08:00:05.000Z',
      healthDay: {
        id: 'day-1',
        localDate: '2026-10-24',
      },
    };

    mockWeightService.registerWeight.mockResolvedValue(mockResult);

    const result = await controller.registerWeight(mockUser, mockDto);

    expect(mockWeightService.registerWeight).toHaveBeenCalledWith('user-123', mockDto);
    expect(result).toEqual(mockResult);
  });

  it('should call weightService.getWeightHistory with userId and query', async () => {
    const mockUser = { sub: 'user-123', email: 'test@example.com' };
    const mockQuery = { limit: 10 };
    const mockList = [
      {
        id: 'weight-1',
        weightKg: 85.2,
        occurredAt: '2026-10-24T08:00:00.000Z',
        createdAt: '2026-10-24T08:00:05.000Z',
        healthDay: {
          id: 'day-1',
          localDate: '2026-10-24',
        },
      },
    ];

    mockWeightService.getWeightHistory.mockResolvedValue(mockList);

    const result = await controller.getWeightHistory(mockUser, mockQuery);

    expect(mockWeightService.getWeightHistory).toHaveBeenCalledWith('user-123', mockQuery);
    expect(result).toEqual(mockList);
  });
});
