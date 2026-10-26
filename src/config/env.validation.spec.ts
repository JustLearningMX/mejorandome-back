import { describe, expect, it } from 'vitest';
import { Environment, validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const validConfig = {
    DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
    GOOGLE_CLIENT_ID: 'google-client-id-test.apps.googleusercontent.com',
    JWT_SECRET: 'super-secret-jwt-key-for-testing',
  };

  it('should validate valid environment with defaults', () => {
    const result = validateEnv(validConfig);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.PORT).toBe(3005);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(result.GOOGLE_CLIENT_ID).toBe(validConfig.GOOGLE_CLIENT_ID);
    expect(result.JWT_SECRET).toBe(validConfig.JWT_SECRET);
    expect(result.JWT_EXPIRES_IN).toBe('7d');
  });

  it('should transform and accept valid custom PORT and NODE_ENV', () => {
    const config = {
      ...validConfig,
      NODE_ENV: 'production',
      PORT: '4000',
      CORS_ORIGIN: 'https://example.com',
      JWT_EXPIRES_IN: '24h',
    };
    const result = validateEnv(config);
    expect(result.NODE_ENV).toBe(Environment.Production);
    expect(result.PORT).toBe(4000);
    expect(result.CORS_ORIGIN).toBe('https://example.com');
    expect(result.JWT_EXPIRES_IN).toBe('24h');
  });

  it('should throw an error on invalid NODE_ENV', () => {
    const config = {
      ...validConfig,
      NODE_ENV: 'invalid_env',
    };
    expect(() => validateEnv(config)).toThrow();
  });

  it('should throw an error when DATABASE_URL is missing', () => {
    const config = {
      GOOGLE_CLIENT_ID: validConfig.GOOGLE_CLIENT_ID,
      JWT_SECRET: validConfig.JWT_SECRET,
    };
    expect(() => validateEnv(config)).toThrow();
  });

  it('should throw an error when GOOGLE_CLIENT_ID is missing', () => {
    const config = {
      DATABASE_URL: validConfig.DATABASE_URL,
      JWT_SECRET: validConfig.JWT_SECRET,
    };
    expect(() => validateEnv(config)).toThrow();
  });

  it('should throw an error when JWT_SECRET is missing', () => {
    const config = {
      DATABASE_URL: validConfig.DATABASE_URL,
      GOOGLE_CLIENT_ID: validConfig.GOOGLE_CLIENT_ID,
    };
    expect(() => validateEnv(config)).toThrow();
  });
});
