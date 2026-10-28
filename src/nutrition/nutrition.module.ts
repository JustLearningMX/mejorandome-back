import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NutritionController } from './nutrition.controller.js';
import { NutritionService } from './nutrition.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}
