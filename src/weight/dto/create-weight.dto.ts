import { Type } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateWeightDto {
  @IsNotEmpty({ message: 'weightKg es requerido' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'weightKg debe ser un número con hasta 2 decimales' })
  @Min(20, { message: 'weightKg debe ser mayor o igual a 20' })
  @Max(350, { message: 'weightKg debe ser menor o igual a 350' })
  weightKg: number;

  @IsOptional()
  @IsISO8601({}, { message: 'occurredAt debe ser una fecha ISO 8601 válida' })
  occurredAt?: string;
}
