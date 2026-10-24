import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WeightController } from './weight.controller.js';
import { WeightService } from './weight.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WeightController],
  providers: [WeightService],
  exports: [WeightService],
})
export class WeightModule {}
