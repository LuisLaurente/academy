import { describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import {
  createAuthenticationConfiguration,
  type AuthenticationConfigurationSource,
} from './configuration/authentication-configuration.js';
import { SessionId } from './domain/identifiers/authentication-ids.js';
import {
  LoginUser,
  LogoutUser,
  RefreshSession,
  RegisterUser,
  ValidateAccessToken,
} from './application/use-cases/authentication-use-cases.js';

const uuidService = new CryptoUuidService();

describe('authentication configuration', () => {
  const source: AuthenticationConfigurationSource = {
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
    expect(Object.isFrozen(configuration.cookies)).toBe(true);
  });
});

describe('pending authentication use cases', () => {
  it.each([
    {
      execute: () =>
        new RegisterUser().execute({ email: 'learner@example.com', password: 'secret' }),
      name: 'RegisterUser',
    },
    {
      execute: () => new LoginUser().execute({ email: 'learner@example.com', password: 'secret' }),
      name: 'LoginUser',
    },
    {
      execute: () =>
        new LogoutUser().execute({ sessionId: SessionId.create(uuidService.generate()) }),
      name: 'LogoutUser',
    },
    {
      execute: () => new RefreshSession().execute({ refreshToken: 'opaque-refresh-token' }),
      name: 'RefreshSession',
    },
    {
      execute: () => new ValidateAccessToken().execute({ accessToken: 'opaque-access-token' }),
      name: 'ValidateAccessToken',
    },
  ])('returns an explicit not-implemented result for $name', async ({ execute, name }) => {
    const result = await execute();

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('authentication.use-case-not-implemented');
      expect(result.error.context).toEqual({ useCase: name });
    }
  });
});
