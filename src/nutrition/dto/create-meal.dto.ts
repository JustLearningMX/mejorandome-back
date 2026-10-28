import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { MealType } from '../interfaces/meal.interface.js';

export const VALID_MEAL_TYPES: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
];

export class CreateMealDto {
  @IsOptional()
  @IsISO8601({}, { message: 'occurredAt debe ser una fecha ISO 8601 válida' })
  occurredAt?: string;

  @IsNotEmpty({ message: 'mealType es requerido' })
  @IsIn(VALID_MEAL_TYPES, {
    message: `mealType debe ser uno de los siguientes valores: ${VALID_MEAL_TYPES.join(', ')}`,
  })
  mealType: MealType;

  @IsNotEmpty({ message: 'description no puede estar vacío' })
  @IsString({ message: 'description debe ser una cadena de texto' })
  @Length(2, 1000, {
    message: 'description debe tener entre 2 y 1000 caracteres',
  })
  description: string;

  @IsNotEmpty({ message: 'hungerBefore es requerido' })
  @Type(() => Number)
  @IsInt({ message: 'hungerBefore debe ser un número entero' })
  @Min(1, { message: 'hungerBefore debe ser un número entero entre 1 y 10' })
  @Max(10, { message: 'hungerBefore debe ser un número entero entre 1 y 10' })
  hungerBefore: number;

  @IsNotEmpty({ message: 'satietyAfter es requerido' })
  @Type(() => Number)
  @IsInt({ message: 'satietyAfter debe ser un número entero' })
  @Min(1, { message: 'satietyAfter debe ser un número entero entre 1 y 10' })
  @Max(10, { message: 'satietyAfter debe ser un número entero entre 1 y 10' })
  satietyAfter: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'wantedMoreEvenIfFull debe ser un booleano' })
  wantedMoreEvenIfFull?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'pausedBeforeMore debe ser un booleano' })
  pausedBeforeMore?: boolean;

  @IsOptional()
  @IsString({ message: 'extraEatingContext debe ser una cadena de texto' })
  @MaxLength(500, {
    message: 'extraEatingContext no debe exceder los 500 caracteres',
  })
  extraEatingContext?: string;
}
