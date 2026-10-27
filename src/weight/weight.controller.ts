import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/auth.interface.js';
import { CreateWeightDto } from './dto/create-weight.dto.js';
import { QueryWeightDto } from './dto/query-weight.dto.js';
import type { WeightMeasurementResponse } from './interfaces/weight.interface.js';
import { WeightService } from './weight.service.js';

@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerWeight(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWeightDto,
  ): Promise<WeightMeasurementResponse> {
    return this.weightService.registerWeight(user.sub, dto);
  }

  @Get()
  async getWeightHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryWeightDto,
  ): Promise<WeightMeasurementResponse[]> {
    return this.weightService.getWeightHistory(user.sub, query);
  }
}
