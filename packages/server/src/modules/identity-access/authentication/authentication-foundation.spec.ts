import { describe, expect, it } from 'vitest';

import {
  createAuthenticationConfiguration,
  type AuthenticationConfigurationSource,
} from './configuration/authentication-configuration.js';

describe('authentication configuration', () => {
  const source: AuthenticationConfigurationSource = {
    AUTH_ARGON2_HASH_LENGTH: 32,
    AUTH_ARGON2_MEMORY_COST_KIB: 19_456,
    AUTH_ARGON2_PARALLELISM: 1,
    AUTH_ARGON2_TIME_COST: 2,
    AUTH_ACCESS_TOKEN_TTL_SECONDS: 900,
    AUTH_COOKIE_ACCESS_NAME: 'learning_os_access',
    AUTH_COOKIE_HTTP_ONLY: true,
    AUTH_COOKIE_PATH: '/',
    AUTH_COOKIE_REFRESH_NAME: 'learning_os_refresh',
    AUTH_COOKIE_SAME_SITE: 'lax',
    AUTH_COOKIE_SECURE: true,
    AUTH_PASSWORD_HASH_ALGORITHM: 'argon2id',
    AUTH_PASSWORD_MIN_LENGTH: 12,
    AUTH_REFRESH_TOKEN_TTL_SECONDS: 2_592_000,
  };

  it('maps the validated central source to an immutable module configuration', () => {
    const configuration = createAuthenticationConfiguration(source);

    expect(configuration).toEqual({
      accessTokenDurationSeconds: 900,
      argon2: {
        hashLength: 32,
        memoryCostKiB: 19_456,
        parallelism: 1,
        timeCost: 2,
      },
      cookies: {
        accessTokenName: 'learning_os_access',
        httpOnly: true,
        path: '/',
        refreshTokenName: 'learning_os_refresh',
        sameSite: 'lax',
        secure: true,
      },
      minimumPasswordLength: 12,
      passwordHashingAlgorithm: 'argon2id',
      refreshTokenDurationSeconds: 2_592_000,
    });
    expect(Object.isFrozen(configuration)).toBe(true);
    expect(Object.isFrozen(configuration.argon2)).toBe(true);
    expect(Object.isFrozen(configuration.cookies)).toBe(true);
  });
});
