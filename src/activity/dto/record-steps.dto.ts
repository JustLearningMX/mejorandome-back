import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class RecordStepsDto {
  @IsNotEmpty({ message: 'steps es requerido' })
  @Type(() => Number)
  @IsInt({ message: 'steps debe ser un número entero' })
  @Min(0, { message: 'steps debe ser mayor o igual a 0' })
  @Max(150000, { message: 'steps no puede ser mayor a 150,000' })
  steps: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'localDate debe tener formato YYYY-MM-DD válido',
  })
  localDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'occurredAt debe ser una fecha ISO 8601 válida' })
  occurredAt?: string;
}

