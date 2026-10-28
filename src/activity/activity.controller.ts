import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/auth.interface.js';
import { ActivityService } from './activity.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { QueryExerciseDto } from './dto/query-exercise.dto.js';
import { QueryStepsDto } from './dto/query-steps.dto.js';
import { RecordStepsDto } from './dto/record-steps.dto.js';
import { UpdateGoalsDto } from './dto/update-goals.dto.js';
import type {
  ActivitySummaryResponse,
  ExerciseEntryResponse,
  StepsGoalResponse,
  StepsHistoryResponse,
  StepsRecordResponse,
} from './interfaces/activity.interface.js';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('steps')
  @HttpCode(HttpStatus.OK)
  async recordSteps(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordStepsDto,
  ): Promise<StepsRecordResponse> {
    return this.activityService.recordSteps(user.sub, dto);
  }

  @Get('steps')
  async getStepsHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryStepsDto,
  ): Promise<StepsHistoryResponse> {
    return this.activityService.getStepsHistory(user.sub, query);
  }

  @Post('exercises')
  @HttpCode(HttpStatus.CREATED)
  async registerExercise(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseEntryResponse> {
    return this.activityService.registerExercise(user.sub, dto);
  }

  @Get('exercises')
  async getExerciseHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryExerciseDto,
  ): Promise<ExerciseEntryResponse[]> {
    return this.activityService.getExerciseHistory(user.sub, query);
  }

  @Delete('exercises/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExercise(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.activityService.deleteExercise(user.sub, id);
  }

  @Get('summary')
  async getActivitySummary(
    @CurrentUser() user: JwtPayload,
  ): Promise<ActivitySummaryResponse> {
    return this.activityService.getActivitySummary(user.sub);
  }

  @Patch('goals')
  async updateGoals(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGoalsDto,
  ): Promise<StepsGoalResponse> {
    return this.activityService.updateGoals(user.sub, dto);
  }
}

