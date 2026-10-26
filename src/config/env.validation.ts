import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3005;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsString()
  @Matches(/^mysql(2)?:\/\/.+/i, {
    message: 'DATABASE_URL debe ser una URL de conexión MySQL válida (mysql://...)',
  })
  DATABASE_URL: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuración de variables de entorno inválida: ${errors.toString()}`);
  }
  return validatedConfig;
}
