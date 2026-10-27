import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMealDto } from './dto/create-meal.dto.js';
import { QueryMealDto } from './dto/query-meal.dto.js';
import type { MealEntryResponse, MealType } from './interfaces/meal.interface.js';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  private getLocalDateString(date: Date, timeZone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    } catch {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    }
  }

  async registerMeal(userId: string, dto: CreateMealDto): Promise<MealEntryResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const localDateStr = this.getLocalDateString(occurredAt, user.timezone);
    const localDate = new Date(`${localDateStr}T00:00:00.000Z`);

    const healthDay = await this.prisma.healthDay.upsert({
      where: {
        userId_localDate: {
          userId,
          localDate,
        },
      },
      update: {},
      create: {
        userId,
        localDate,
      },
    });

    const meal = await this.prisma.mealEntry.create({
      data: {
        healthDayId: healthDay.id,
        mealType: dto.mealType,
        occurredAt,
        description: dto.description,
        hungerBefore: dto.hungerBefore,
        satietyAfter: dto.satietyAfter,
        wantedMoreEvenIfFull: dto.wantedMoreEvenIfFull ?? false,
        pausedBeforeMore: dto.pausedBeforeMore ?? null,
        extraEatingContext: dto.extraEatingContext ?? null,
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

    return {
      id: meal.id,
      occurredAt: meal.occurredAt.toISOString(),
      mealType: meal.mealType as MealType,
      description: meal.description,
      hungerBefore: meal.hungerBefore,
      satietyAfter: meal.satietyAfter,
      wantedMoreEvenIfFull: meal.wantedMoreEvenIfFull ?? false,
      pausedBeforeMore: meal.pausedBeforeMore,
      extraEatingContext: meal.extraEatingContext,
      createdAt: meal.createdAt.toISOString(),
      healthDay: {
        id: meal.healthDay.id,
        localDate: meal.healthDay.localDate.toISOString().split('T')[0],
      },
    };
  }

  async getMealHistory(userId: string, query: QueryMealDto): Promise<MealEntryResponse[]> {
    const limit = query.limit ?? 30;

    const healthDayFilter: { userId: string; localDate?: Date } = { userId };
    if (query.localDate) {
      healthDayFilter.localDate = new Date(`${query.localDate}T00:00:00.000Z`);
    }

    const meals = await this.prisma.mealEntry.findMany({
      where: {
        healthDay: healthDayFilter,
        ...(query.mealType ? { mealType: query.mealType } : {}),
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
      take: limit,
    });

    return meals.map((meal) => ({
      id: meal.id,
      occurredAt: meal.occurredAt.toISOString(),
      mealType: meal.mealType as MealType,
      description: meal.description,
      hungerBefore: meal.hungerBefore,
      satietyAfter: meal.satietyAfter,
      wantedMoreEvenIfFull: meal.wantedMoreEvenIfFull ?? false,
      pausedBeforeMore: meal.pausedBeforeMore,
      extraEatingContext: meal.extraEatingContext,
      createdAt: meal.createdAt.toISOString(),
      healthDay: {
        id: meal.healthDay.id,
        localDate: meal.healthDay.localDate.toISOString().split('T')[0],
      },
    }));
  }

  async deleteMeal(userId: string, mealId: string): Promise<void> {
    const meal = await this.prisma.mealEntry.findFirst({
      where: {
        id: mealId,
        healthDay: {
          userId,
        },
      },
    });

    if (!meal) {
      throw new NotFoundException('Registro de comida no encontrado');
    }

    await this.prisma.mealEntry.delete({
      where: { id: mealId },
    });
  }
}
