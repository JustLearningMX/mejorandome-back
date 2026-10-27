import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWeightDto } from './dto/create-weight.dto.js';
import { QueryWeightDto } from './dto/query-weight.dto.js';
import type { WeightMeasurementResponse } from './interfaces/weight.interface.js';

@Injectable()
export class WeightService {
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

  async registerWeight(userId: string, dto: CreateWeightDto): Promise<WeightMeasurementResponse> {
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

    const measurement = await this.prisma.weightMeasurement.create({
      data: {
        healthDayId: healthDay.id,
        weightKg: dto.weightKg,
        occurredAt,
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
      id: measurement.id,
      weightKg: Number(measurement.weightKg),
      occurredAt: measurement.occurredAt.toISOString(),
      createdAt: measurement.createdAt.toISOString(),
      healthDay: {
        id: measurement.healthDay.id,
        localDate: measurement.healthDay.localDate.toISOString().split('T')[0],
      },
    };
  }

  async getWeightHistory(userId: string, query: QueryWeightDto): Promise<WeightMeasurementResponse[]> {
    const limit = query.limit ?? 30;

    const measurements = await this.prisma.weightMeasurement.findMany({
      where: {
        healthDay: {
          userId,
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
      take: limit,
    });

    return measurements.map((m) => ({
      id: m.id,
      weightKg: Number(m.weightKg),
      occurredAt: m.occurredAt.toISOString(),
      createdAt: m.createdAt.toISOString(),
      healthDay: {
        id: m.healthDay.id,
        localDate: m.healthDay.localDate.toISOString().split('T')[0],
      },
    }));
  }
}
