import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/auth.interface.js';
import { CreateMealDto } from './dto/create-meal.dto.js';
import { QueryMealDto } from './dto/query-meal.dto.js';
import type { MealEntryResponse } from './interfaces/meal.interface.js';
import { NutritionService } from './nutrition.service.js';

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Post('meals')
  @HttpCode(HttpStatus.CREATED)
  async registerMeal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMealDto,
  ): Promise<MealEntryResponse> {
    return this.nutritionService.registerMeal(user.sub, dto);
  }

  @Get('meals')
  async getMealHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryMealDto,
  ): Promise<MealEntryResponse[]> {
    return this.nutritionService.getMealHistory(user.sub, query);
  }

  @Delete('meals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMeal(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.nutritionService.deleteMeal(user.sub, id);
  }
}
