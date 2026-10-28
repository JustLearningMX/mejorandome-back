import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { QueryExerciseDto } from './dto/query-exercise.dto.js';
import { QueryStepsDto } from './dto/query-steps.dto.js';
import { RecordStepsDto } from './dto/record-steps.dto.js';
import { UpdateGoalsDto } from './dto/update-goals.dto.js';
import type {
  ActivitySummaryResponse,
  ActivitySummaryToday,
  ActivitySummaryWeek,
  ExerciseEntryResponse,
  StepsGoalResponse,
  StepsHistoryItem,
  StepsHistoryResponse,
  StepsRecordResponse,
} from './interfaces/activity.interface.js';

@Injectable()
export class ActivityService {
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

  async recordSteps(
    userId: string,
    dto: RecordStepsDto,
  ): Promise<StepsRecordResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, stepsGoal: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let localDateStr: string;
    if (dto.localDate) {
      localDateStr = dto.localDate;
    } else if (dto.occurredAt) {
      localDateStr = this.getLocalDateString(new Date(dto.occurredAt), user.timezone);
    } else {
      localDateStr = this.getLocalDateString(new Date(), user.timezone);
    }

    const localDate = new Date(`${localDateStr}T00:00:00.000Z`);
    const recordedAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

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

    const dailyActivity = await this.prisma.dailyActivity.upsert({
      where: {
        healthDayId: healthDay.id,
      },
      update: {
        steps: dto.steps,
        recordedAt,
      },
      create: {
        healthDayId: healthDay.id,
        steps: dto.steps,
        source: 'manual',
        recordedAt,
      },
    });

    const goal = user.stepsGoal;
    const progressPct =
      goal > 0 ? Math.round((dto.steps / goal) * 100 * 10) / 10 : 0;

    return {
      id: dailyActivity.id,
      localDate: localDateStr,
      steps: dailyActivity.steps,
      goal,
      progressPct,
      updatedAt: dailyActivity.updatedAt.toISOString(),
      healthDay: {
        id: healthDay.id,
        localDate: localDateStr,
      },
    };
  }

  async getStepsHistory(
    userId: string,
    query: QueryStepsDto,
  ): Promise<StepsHistoryResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, stepsGoal: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const limit = query.limit ?? 30;
    const goal = user.stepsGoal;

    let startDateObj = query.startDate
      ? new Date(`${query.startDate}T00:00:00.000Z`)
      : undefined;
    let endDateObj = query.endDate
      ? new Date(`${query.endDate}T00:00:00.000Z`)
      : undefined;

    if (!startDateObj && !endDateObj) {
      const todayStr = this.getLocalDateString(new Date(), user.timezone);
      const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
      const sevenDaysAgo = new Date(todayDate);
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
      startDateObj = sevenDaysAgo;
      endDateObj = todayDate;
    }

    const healthDays = await this.prisma.healthDay.findMany({
      where: {
        userId,
        dailyActivity: {
          isNot: null,
        },
        localDate: {
          ...(startDateObj ? { gte: startDateObj } : {}),
          ...(endDateObj ? { lte: endDateObj } : {}),
        },
      },
      include: {
        dailyActivity: true,
      },
      orderBy: {
        localDate: 'desc',
      },
      take: limit,
    });

    const items: StepsHistoryItem[] = healthDays
      .filter((hd) => hd.dailyActivity !== null)
      .map((hd) => {
        const steps = hd.dailyActivity!.steps;
        const progressPct =
          goal > 0 ? Math.round((steps / goal) * 100 * 10) / 10 : 0;
        return {
          localDate: hd.localDate.toISOString().split('T')[0],
          steps,
          goal,
          progressPct,
          completed: steps >= goal,
        };
      });

    const totalSteps = items.reduce((acc, curr) => acc + curr.steps, 0);
    const daysCount = items.length;
    const averageSteps = daysCount > 0 ? Math.round(totalSteps / daysCount) : 0;

    return {
      items,
      averageSteps,
      totalSteps,
      daysCount,
    };
  }

  async registerExercise(
    userId: string,
    dto: CreateExerciseDto,
  ): Promise<ExerciseEntryResponse> {
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

    const exercise = await this.prisma.exerciseSession.create({
      data: {
        healthDayId: healthDay.id,
        exerciseType: dto.exerciseType,
        durationMinutes: dto.durationMinutes,
        intensity: dto.intensity ?? null,
        caloriesBurned: dto.caloriesBurned ?? null,
        occurredAt,
        notes: dto.notes ?? null,
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
      id: exercise.id,
      occurredAt: exercise.occurredAt.toISOString(),
      exerciseType: exercise.exerciseType,
      durationMinutes: exercise.durationMinutes,
      intensity: exercise.intensity,
      caloriesBurned: exercise.caloriesBurned,
      notes: exercise.notes,
      createdAt: exercise.createdAt.toISOString(),
      healthDay: {
        id: exercise.healthDay.id,
        localDate: exercise.healthDay.localDate.toISOString().split('T')[0],
      },
    };
  }

  async getExerciseHistory(
    userId: string,
    query: QueryExerciseDto,
  ): Promise<ExerciseEntryResponse[]> {
    const limit = query.limit ?? 30;

    const healthDayFilter: {
      userId: string;
      localDate?: Date | { gte?: Date; lte?: Date };
    } = { userId };

    if (query.localDate) {
      healthDayFilter.localDate = new Date(`${query.localDate}T00:00:00.000Z`);
    } else if (query.startDate || query.endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (query.startDate) {
        dateRange.gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        dateRange.lte = new Date(`${query.endDate}T00:00:00.000Z`);
      }
      healthDayFilter.localDate = dateRange;
    }

    const exercises = await this.prisma.exerciseSession.findMany({
      where: {
        healthDay: healthDayFilter,
        ...(query.exerciseType ? { exerciseType: query.exerciseType } : {}),
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

    return exercises.map((exercise) => ({
      id: exercise.id,
      occurredAt: exercise.occurredAt.toISOString(),
      exerciseType: exercise.exerciseType,
      durationMinutes: exercise.durationMinutes,
      intensity: exercise.intensity,
      caloriesBurned: exercise.caloriesBurned,
      notes: exercise.notes,
      createdAt: exercise.createdAt.toISOString(),
      healthDay: {
        id: exercise.healthDay.id,
        localDate: exercise.healthDay.localDate.toISOString().split('T')[0],
      },
    }));
  }

  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    const exercise = await this.prisma.exerciseSession.findFirst({
      where: {
        id: exerciseId,
        healthDay: {
          userId,
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Sesión de ejercicio no encontrada');
    }

    await this.prisma.exerciseSession.delete({
      where: { id: exerciseId },
    });
  }

  async updateGoals(
    userId: string,
    dto: UpdateGoalsDto,
  ): Promise<StepsGoalResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { stepsGoal: dto.stepsGoal },
      select: { stepsGoal: true },
    });

    return { stepsGoal: user.stepsGoal };
  }

  async getActivitySummary(userId: string): Promise<ActivitySummaryResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, stepsGoal: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const todayStr = this.getLocalDateString(new Date(), user.timezone);
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const sevenDaysAgoDate = new Date(todayDate);
    sevenDaysAgoDate.setUTCDate(sevenDaysAgoDate.getUTCDate() - 6);

    const weekHealthDays = await this.prisma.healthDay.findMany({
      where: {
        userId,
        localDate: {
          gte: sevenDaysAgoDate,
          lte: todayDate,
        },
      },
      include: {
        dailyActivity: true,
        exerciseSessions: true,
      },
    });

    const todayDay = weekHealthDays.find(
      (d) => d.localDate.toISOString().split('T')[0] === todayStr,
    );

    const steps = todayDay?.dailyActivity?.steps ?? 0;
    const stepsGoal = user.stepsGoal;
    const stepsProgressPct =
      stepsGoal > 0 ? Math.round((steps / stepsGoal) * 100 * 10) / 10 : 0;

    const exerciseMinutes = todayDay
      ? todayDay.exerciseSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      : 0;
    const exerciseSessionsCount = todayDay
      ? todayDay.exerciseSessions.length
      : 0;
    const hasActivityToday = steps > 0 || exerciseSessionsCount > 0;

    const today: ActivitySummaryToday = {
      localDate: todayStr,
      steps,
      stepsGoal,
      stepsProgressPct,
      exerciseMinutes,
      exerciseSessionsCount,
      hasActivityToday,
    };

    const daysWithDailyActivity = weekHealthDays.filter(
      (d) => d.dailyActivity !== null,
    );
    const totalSteps = daysWithDailyActivity.reduce(
      (sum, d) => sum + d.dailyActivity!.steps,
      0,
    );
    const weeklyAverageSteps =
      daysWithDailyActivity.length > 0
        ? Math.round(totalSteps / daysWithDailyActivity.length)
        : 0;

    const totalExerciseMinutes = weekHealthDays.reduce(
      (sum, d) =>
        sum +
        d.exerciseSessions.reduce((sSum, s) => sSum + s.durationMinutes, 0),
      0,
    );

    const exerciseDaysCount = weekHealthDays.filter(
      (d) => d.exerciseSessions.length > 0,
    ).length;

    const daysMeetingGoalCount = weekHealthDays.filter(
      (d) => d.dailyActivity && d.dailyActivity.steps >= stepsGoal,
    ).length;

    const week: ActivitySummaryWeek = {
      weeklyAverageSteps,
      totalExerciseMinutes,
      exerciseDaysCount,
      daysMeetingGoalCount,
    };

    return {
      today,
      week,
    };
  }
}

