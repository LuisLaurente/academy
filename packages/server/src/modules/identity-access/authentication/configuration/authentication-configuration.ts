export type PasswordHashingAlgorithm = 'argon2id';
export type AuthenticationCookieSameSite = 'lax' | 'strict';

export interface AuthenticationCookieConfiguration {
  readonly accessTokenName: string;
  readonly domain?: string;
  readonly httpOnly: true;
  readonly path: string;
  readonly refreshTokenName: string;
  readonly sameSite: AuthenticationCookieSameSite;
  readonly secure: boolean;
}

export interface AuthenticationConfiguration {
  readonly accessTokenDurationSeconds: number;
  readonly cookies: AuthenticationCookieConfiguration;
  readonly minimumPasswordLength: number;
  readonly passwordHashingAlgorithm: PasswordHashingAlgorithm;
  readonly refreshTokenDurationSeconds: number;
}

export interface AuthenticationConfigurationSource {
  readonly AUTH_ACCESS_TOKEN_TTL_SECONDS: number;
  readonly AUTH_COOKIE_ACCESS_NAME: string;
  readonly AUTH_COOKIE_DOMAIN?: string;
  readonly AUTH_COOKIE_HTTP_ONLY: true;
  readonly AUTH_COOKIE_PATH: string;
  readonly AUTH_COOKIE_REFRESH_NAME: string;
  readonly AUTH_COOKIE_SAME_SITE: AuthenticationCookieSameSite;
  readonly AUTH_COOKIE_SECURE: boolean;
  readonly AUTH_PASSWORD_HASH_ALGORITHM: PasswordHashingAlgorithm;
  readonly AUTH_PASSWORD_MIN_LENGTH: number;
  readonly AUTH_REFRESH_TOKEN_TTL_SECONDS: number;
}

export function createAuthenticationConfiguration(
  source: AuthenticationConfigurationSource,
): AuthenticationConfiguration {
  const cookies = Object.freeze({
    accessTokenName: source.AUTH_COOKIE_ACCESS_NAME,
    ...(source.AUTH_COOKIE_DOMAIN === undefined ? {} : { domain: source.AUTH_COOKIE_DOMAIN }),
    httpOnly: source.AUTH_COOKIE_HTTP_ONLY,
    path: source.AUTH_COOKIE_PATH,
    refreshTokenName: source.AUTH_COOKIE_REFRESH_NAME,
    sameSite: source.AUTH_COOKIE_SAME_SITE,
    secure: source.AUTH_COOKIE_SECURE,
  });

  return Object.freeze({
    accessTokenDurationSeconds: source.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    cookies,
    minimumPasswordLength: source.AUTH_PASSWORD_MIN_LENGTH,
    passwordHashingAlgorithm: source.AUTH_PASSWORD_HASH_ALGORITHM,
    refreshTokenDurationSeconds: source.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  });
}
