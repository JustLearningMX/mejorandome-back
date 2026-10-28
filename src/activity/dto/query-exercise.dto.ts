import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class QueryExerciseDto {
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
  @IsString({ message: 'exerciseType debe ser una cadena de texto' })
  exerciseType?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate debe tener el formato YYYY-MM-DD',
  })
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate debe tener el formato YYYY-MM-DD',
  })
  endDate?: string;
}

