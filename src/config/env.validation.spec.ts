import { describe, expect, it } from 'vitest';
import { Environment, validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const validDatabaseUrl = 'mysql://user:pass@localhost:3306/db';

  it('should validate valid environment with defaults', () => {
    const config = {
      DATABASE_URL: validDatabaseUrl,
    };
    const result = validateEnv(config);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.PORT).toBe(3000);
    expect(result.DATABASE_URL).toBe(validDatabaseUrl);
  });

  it('should transform and accept valid custom PORT and NODE_ENV', () => {
    const config = {
      NODE_ENV: 'production',
      PORT: '4000',
      CORS_ORIGIN: 'https://example.com',
      DATABASE_URL: validDatabaseUrl,
    };
    const result = validateEnv(config);
    expect(result.NODE_ENV).toBe(Environment.Production);
    expect(result.PORT).toBe(4000);
    expect(result.CORS_ORIGIN).toBe('https://example.com');
    expect(result.DATABASE_URL).toBe(validDatabaseUrl);
  });

  it('should throw an error on invalid NODE_ENV', () => {
    const config = {
      NODE_ENV: 'invalid_env',
      DATABASE_URL: validDatabaseUrl,
    };
    expect(() => validateEnv(config)).toThrow();
  });

  it('should throw an error when DATABASE_URL is missing', () => {
    const config = {
      NODE_ENV: 'development',
    };
    expect(() => validateEnv(config)).toThrow();
  });
});
