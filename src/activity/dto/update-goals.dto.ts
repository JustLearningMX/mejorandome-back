import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class UpdateGoalsDto {
  @IsNotEmpty({ message: 'stepsGoal es requerido' })
  @Type(() => Number)
  @IsInt({ message: 'stepsGoal debe ser un número entero' })
  @Min(1000, { message: 'stepsGoal debe ser al menos 1,000 pasos' })
  @Max(50000, { message: 'stepsGoal no puede exceder 50,000 pasos' })
  stepsGoal: number;
}

