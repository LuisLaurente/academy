import { describe, expect, it } from 'vitest';

import { validateApiEnvironment, validateWebEnvironment } from './environment';

describe('environment configuration', () => {
  it('normalizes a valid API environment', () => {
    const environment = validateApiEnvironment({
      NODE_ENV: 'test',
      API_PORT: '3101',
      CORS_ORIGIN: 'http://localhost:3100',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      REDIS_URL: 'redis://localhost:6379/1',
      BULLMQ_PREFIX: 'learning-os-test',
    });

    expect(environment.API_PORT).toBe(3101);
    expect(environment.NODE_ENV).toBe('test');
  });

  it('provides a safe local default for the public API URL', () => {
    const environment = validateWebEnvironment({ NODE_ENV: 'development' });

    expect(environment.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001');
  });
});
