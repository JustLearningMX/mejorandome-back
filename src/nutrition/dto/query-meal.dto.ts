import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import type { MealType } from '../interfaces/meal.interface.js';
import { VALID_MEAL_TYPES } from './create-meal.dto.js';

export class QueryMealDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit debe ser menor o igual a 100' })
  limit?: number = 30;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'localDate debe tener el formato YYYY-MM-DD',
  })
  localDate?: string;

  @IsOptional()
  @IsIn(VALID_MEAL_TYPES, {
    message: `mealType debe ser uno de los siguientes valores: ${VALID_MEAL_TYPES.join(', ')}`,
  })
  mealType?: MealType;
}
