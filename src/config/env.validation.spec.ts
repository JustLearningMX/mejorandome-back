import { describe, expect, it } from 'vitest';
import { Environment, validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('should validate valid environment with defaults', () => {
    const config = {};
    const result = validateEnv(config);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.PORT).toBe(3000);
  });

  it('should transform and accept valid custom PORT and NODE_ENV', () => {
    const config = {
      NODE_ENV: 'production',
      PORT: '4000',
      CORS_ORIGIN: 'https://example.com',
    };
    const result = validateEnv(config);
    expect(result.NODE_ENV).toBe(Environment.Production);
    expect(result.PORT).toBe(4000);
    expect(result.CORS_ORIGIN).toBe('https://example.com');
  });

  it('should throw an error on invalid NODE_ENV', () => {
    const config = {
      NODE_ENV: 'invalid_env',
    };
    expect(() => validateEnv(config)).toThrow();
  });
});
