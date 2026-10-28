import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityModule } from './activity/activity.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { NutritionModule } from './nutrition/nutrition.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { WeightModule } from './weight/weight.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    WeightModule,
    NutritionModule,
    ActivityModule,
  ],
})
export class AppModule {}
