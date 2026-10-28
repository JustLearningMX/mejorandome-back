import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  ExerciseIntensity,
  ExerciseType,
} from '../interfaces/activity.interface.js';

export const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'walking',
  'running',
  'strength_training',
  'cycling',
  'swimming',
  'yoga',
  'hiit',
  'sports',
  'other',
];

export const VALID_INTENSITIES: ExerciseIntensity[] = [
  'light',
  'moderate',
  'vigorous',
  'extreme',
];

export class CreateExerciseDto {
  @IsNotEmpty({ message: 'exerciseType es requerido' })
  @IsString({ message: 'exerciseType debe ser una cadena de texto' })
  @IsIn(VALID_EXERCISE_TYPES, {
    message: `exerciseType debe ser uno de los siguientes valores: ${VALID_EXERCISE_TYPES.join(', ')}`,
  })
  exerciseType: ExerciseType;

  @IsNotEmpty({ message: 'durationMinutes es requerido' })
  @Type(() => Number)
  @IsInt({ message: 'durationMinutes debe ser un número entero' })
  @Min(1, { message: 'durationMinutes debe ser entre 1 y 720 minutos' })
  @Max(720, { message: 'durationMinutes debe ser entre 1 y 720 minutos' })
  durationMinutes: number;

  @IsOptional()
  @IsIn(VALID_INTENSITIES, {
    message: `intensity debe ser uno de los siguientes valores: ${VALID_INTENSITIES.join(', ')}`,
  })
  intensity?: ExerciseIntensity;

  @IsOptional()
  @IsISO8601({}, { message: 'occurredAt debe ser una fecha ISO 8601 válida' })
  occurredAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'caloriesBurned debe ser un número entero' })
  @Min(0, { message: 'caloriesBurned debe ser mayor o igual a 0' })
  @Max(10000, { message: 'caloriesBurned no puede exceder 10000' })
  caloriesBurned?: number;

  @IsOptional()
  @IsString({ message: 'notes debe ser una cadena de texto' })
  @MaxLength(500, { message: 'notes no debe exceder los 500 caracteres' })
  notes?: string;
}

