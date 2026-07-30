import { describe, expect, it } from 'vitest';

import { validateApiEnvironment, validateWebEnvironment } from './environment';

const validApiEnvironment = {
  NODE_ENV: 'test',
  API_PORT: '3101',
  CORS_ORIGIN: 'http://localhost:3100',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
  REDIS_URL: 'redis://localhost:6379/1',
  BULLMQ_PREFIX: 'learning-os-test',
} as const;

describe('environment configuration', () => {
  it('normalizes a valid API environment', () => {
    const environment = validateApiEnvironment(validApiEnvironment);

    expect(environment.API_PORT).toBe(3101);
    expect(environment.NODE_ENV).toBe('test');
    expect(environment.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    expect(environment.AUTH_REFRESH_TOKEN_TTL_SECONDS).toBe(2_592_000);
    expect(environment.AUTH_PASSWORD_HASH_ALGORITHM).toBe('argon2id');
    expect(environment.AUTH_ARGON2_MEMORY_COST_KIB).toBe(19_456);
    expect(environment.AUTH_ARGON2_TIME_COST).toBe(2);
    expect(environment.AUTH_ARGON2_PARALLELISM).toBe(1);
    expect(environment.AUTH_ARGON2_HASH_LENGTH).toBe(32);
    expect(environment.AUTH_PASSWORD_MIN_LENGTH).toBe(12);
    expect(environment.AUTH_COOKIE_HTTP_ONLY).toBe(true);
    expect(environment.AUTH_COOKIE_SECURE).toBe(true);
  });

  it('rejects insecure authentication cookies in production', () => {
    expect(() =>
      validateApiEnvironment({
        ...validApiEnvironment,
        NODE_ENV: 'production',
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toThrow();
  });

  it('rejects disabling HttpOnly or selecting an unsupported hashing algorithm', () => {
    expect(() =>
      validateApiEnvironment({ ...validApiEnvironment, AUTH_COOKIE_HTTP_ONLY: 'false' }),
    ).toThrow();
    expect(() =>
      validateApiEnvironment({ ...validApiEnvironment, AUTH_PASSWORD_HASH_ALGORITHM: 'bcrypt' }),
    ).toThrow();
  });

  it('rejects Argon2id parameters below the security baseline', () => {
    expect(() =>
      validateApiEnvironment({ ...validApiEnvironment, AUTH_ARGON2_MEMORY_COST_KIB: '8192' }),
    ).toThrow();
    expect(() =>
      validateApiEnvironment({ ...validApiEnvironment, AUTH_ARGON2_TIME_COST: '1' }),
    ).toThrow();
  });

  it('provides a safe local default for the public API URL', () => {
    const environment = validateWebEnvironment({ NODE_ENV: 'development' });

    expect(environment.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001/api/v1');
  });
});
