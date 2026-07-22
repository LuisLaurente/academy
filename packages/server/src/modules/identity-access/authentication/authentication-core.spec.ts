import { randomBytes } from 'node:crypto';

import { beforeAll, describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import type { Clock } from '../../../core/time/clock.js';
import { Session, User } from './domain/aggregates/authentication-aggregates.js';
import {
  EmailAlreadyExistsError,
  ExpiredTokenError,
  InvalidAuthenticationStateError,
  InvalidCredentialsError,
  InvalidSessionError,
  InvalidTokenError,
  WeakPasswordError,
} from './domain/errors/authentication-errors.js';
import { SessionId, UserId } from './domain/identifiers/authentication-ids.js';
import { Email } from './domain/value-objects/email.js';
import { HashedPassword } from './domain/value-objects/hashed-password.js';
import { PlainPassword } from './domain/value-objects/plain-password.js';
import {
  LoginUser,
  LogoutUser,
  RefreshSession,
  RegisterUser,
  ValidateAccessToken,
} from './application/use-cases/authentication-use-cases.js';
import {
  createAuthenticationConfiguration,
  type AuthenticationConfiguration,
} from './configuration/authentication-configuration.js';
import {
  Argon2PasswordAdapter,
  OpaqueTokenAdapter,
} from './infrastructure/cryptography/authentication-cryptography.js';
import {
  InMemoryAuthenticationRepository,
  InMemorySessionRepository,
  InMemoryUnitOfWork,
} from './infrastructure/testing/in-memory-authentication.js';

const uuidService = new CryptoUuidService();
const NOW = new Date('2026-07-21T20:00:00.000Z');
const TOKEN_HASH = 'a'.repeat(64);
const configuration: AuthenticationConfiguration = createAuthenticationConfiguration({
  AUTH_ACCESS_TOKEN_TTL_SECONDS: 900,
  AUTH_ARGON2_HASH_LENGTH: 32,
  AUTH_ARGON2_MEMORY_COST_KIB: 19_456,
  AUTH_ARGON2_PARALLELISM: 1,
  AUTH_ARGON2_TIME_COST: 2,
  AUTH_COOKIE_ACCESS_NAME: 'learning_os_access',
  AUTH_COOKIE_HTTP_ONLY: true,
  AUTH_COOKIE_PATH: '/',
  AUTH_COOKIE_REFRESH_NAME: 'learning_os_refresh',
  AUTH_COOKIE_SAME_SITE: 'lax',
  AUTH_COOKIE_SECURE: true,
  AUTH_PASSWORD_HASH_ALGORITHM: 'argon2id',
  AUTH_PASSWORD_MIN_LENGTH: 12,
  AUTH_REFRESH_TOKEN_TTL_SECONDS: 2_592_000,
});

class MutableClock implements Clock {
  #value: Date;

  constructor(value: Date) {
    this.#value = new Date(value);
  }

  now(): Date {
    return new Date(this.#value);
  }

  set(value: Date): void {
    this.#value = new Date(value);
  }
}

function email(value = 'learner@example.com'): Email {
  const result = Email.create(value);
  if (!result.isSuccess) throw result.error;
  return result.value;
}

function password(value = 'Correct horse battery staple'): PlainPassword {
  const result = PlainPassword.create(value, configuration.minimumPasswordLength);
  if (!result.isSuccess) throw result.error;
  return result.value;
}

function passwordHash(value = '$argon2id$test-hash'): HashedPassword {
  const result = HashedPassword.create(value);
  if (!result.isSuccess) throw result.error;
  return result.value;
}

function user(active = true): User {
  return User.rehydrate({
    active,
    createdAt: NOW,
    email: email(),
    id: UserId.create(uuidService.generate()),
    passwordHash: passwordHash(),
    updatedAt: NOW,
  });
}

function session(overrides: Partial<Parameters<typeof Session.rehydrate>[0]> = {}): Session {
  return Session.rehydrate({
    createdAt: NOW,
    expiresAt: new Date(NOW.getTime() + 60_000),
    id: SessionId.create(uuidService.generate()),
    refreshTokenHash: TOKEN_HASH,
    userId: UserId.create(uuidService.generate()),
    ...overrides,
  });
}

describe('authentication aggregates', () => {
  it('registers an active user and records a data-minimal event', () => {
    const aggregate = User.register({
      active: true,
      createdAt: NOW,
      email: email('LEARNER@EXAMPLE.COM'),
      eventId: uuidService.generate(),
      id: UserId.create(uuidService.generate()),
      passwordHash: passwordHash(),
      updatedAt: NOW,
    });

    expect(aggregate.active).toBe(true);
    expect(aggregate.email.value).toBe('learner@example.com');
    expect(aggregate.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'UserRegistered',
    ]);
    expect(aggregate.pendingDomainEvents[0]?.payload).toEqual({});
    const externalDate = aggregate.createdAt;
    externalDate.setUTCFullYear(2030);
    expect(aggregate.createdAt).toEqual(NOW);
  });

  it('rejects invalid user chronology', () => {
    expect(() =>
      User.rehydrate({
        active: true,
        createdAt: NOW,
        email: email(),
        id: UserId.create(uuidService.generate()),
        passwordHash: passwordHash(),
        updatedAt: new Date(NOW.getTime() - 1),
      }),
    ).toThrow(InvalidAuthenticationStateError);
  });

  it('tracks session expiration, revocation and events', () => {
    const aggregate = Session.start({
      createdAt: NOW,
      eventId: uuidService.generate(),
      expiresAt: new Date(NOW.getTime() + 60_000),
      id: SessionId.create(uuidService.generate()),
      refreshTokenHash: TOKEN_HASH,
      userId: UserId.create(uuidService.generate()),
    });

    expect(aggregate.isExpired(new Date(NOW.getTime() + 59_999))).toBe(false);
    expect(aggregate.isExpired(new Date(NOW.getTime() + 60_000))).toBe(true);
    expect(aggregate.isRevoked()).toBe(false);
    expect(aggregate.pendingDomainEvents[0]?.eventName).toBe('UserLoggedIn');

    const revocation = aggregate.revoke({ at: NOW, eventId: uuidService.generate() });
    expect(revocation.isSuccess).toBe(true);
    expect(aggregate.isRevoked()).toBe(true);
    expect(aggregate.pendingDomainEvents[1]?.eventName).toBe('UserLoggedOut');
    expect(aggregate.revoke({ at: NOW, eventId: uuidService.generate() }).isSuccess).toBe(false);
  });

  it('rotates a live session and rejects invalid, expired or revoked state', () => {
    const live = session();
    const rotation = live.rotateRefreshToken({
      at: NOW,
      eventId: uuidService.generate(),
      expiresAt: new Date(NOW.getTime() + 120_000),
      refreshTokenHash: 'b'.repeat(64),
    });
    expect(rotation.isSuccess).toBe(true);
    expect(live.refreshTokenHash).toBe('b'.repeat(64));
    expect(live.pendingDomainEvents[0]?.eventName).toBe('SessionRefreshed');

    const expired = session({ expiresAt: new Date(NOW.getTime() + 1) });
    const expiredResult = expired.rotateRefreshToken({
      at: new Date(NOW.getTime() + 1),
      eventId: uuidService.generate(),
      expiresAt: new Date(NOW.getTime() + 120_000),
      refreshTokenHash: 'c'.repeat(64),
    });
    expect(expiredResult.isSuccess).toBe(false);
    if (!expiredResult.isSuccess) expect(expiredResult.error).toBeInstanceOf(ExpiredTokenError);

    const revoked = session();
    revoked.revoke({ at: NOW, eventId: uuidService.generate() });
    expect(
      revoked.rotateRefreshToken({
        at: NOW,
        eventId: uuidService.generate(),
        expiresAt: new Date(NOW.getTime() + 120_000),
        refreshTokenHash: 'd'.repeat(64),
      }).isSuccess,
    ).toBe(false);

    expect(() => session({ refreshTokenHash: 'not-a-digest' })).toThrow(
      InvalidAuthenticationStateError,
    );
  });
});

describe('cryptography adapters', () => {
  let argon2: Argon2PasswordAdapter;
  let tokens: OpaqueTokenAdapter;

  beforeAll(async () => {
    argon2 = await Argon2PasswordAdapter.create(configuration.argon2);
    tokens = new OpaqueTokenAdapter(randomBytes(32), uuidService);
  });

  it('hashes with Argon2id using unique salts and verifies without exposing plaintext', async () => {
    const first = await argon2.hash(password());
    const second = await argon2.hash(password());

    expect(first.reveal()).toMatch(/^\$argon2id\$/u);
    expect(first.equals(second)).toBe(false);
    expect(await argon2.verify(password(), first)).toBe(true);
    expect(await argon2.verify(password('Different secure password'), first)).toBe(false);
    expect(await argon2.verify(password(), undefined)).toBe(false);
    expect(await argon2.verify(password(), passwordHash('malformed'))).toBe(false);
  });

  it('generates unique authenticated opaque tokens and validates kind and expiry', async () => {
    const request = {
      expiresAt: new Date(NOW.getTime() + 60_000),
      sessionId: SessionId.create(uuidService.generate()),
      userId: UserId.create(uuidService.generate()),
    };
    const first = await tokens.generateAccessToken(request);
    const second = await tokens.generateAccessToken(request);
    const refresh = await tokens.generateRefreshToken(request);

    expect(first.value).not.toBe(second.value);
    expect(first.value).not.toContain(request.userId.toString());
    expect(tokens.matchesHash(first.value, first.hash)).toBe(true);
    expect(tokens.matchesHash(second.value, first.hash)).toBe(false);

    const verified = await tokens.verifyAccessToken(first.value, NOW);
    expect(verified.isSuccess).toBe(true);
    if (verified.isSuccess) {
      expect(verified.value.userId.equals(request.userId)).toBe(true);
      expect(verified.value.sessionId.equals(request.sessionId)).toBe(true);
    }
    expect((await tokens.verifyAccessToken(refresh.value, NOW)).isSuccess).toBe(false);
    const expired = await tokens.verifyAccessToken(first.value, request.expiresAt);
    expect(expired.isSuccess).toBe(false);
    if (!expired.isSuccess) expect(expired.error).toBeInstanceOf(ExpiredTokenError);
  });

  it('rejects tampering, malformed tokens and invalid key material', async () => {
    const generated = await tokens.generateAccessToken({
      expiresAt: new Date(NOW.getTime() + 60_000),
      sessionId: SessionId.create(uuidService.generate()),
      userId: UserId.create(uuidService.generate()),
    });
    const tampered = `${generated.value.slice(0, -1)}x`;
    for (const candidate of [tampered, 'not-a-token', '']) {
      const result = await tokens.verifyAccessToken(candidate, NOW);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidTokenError);
    }
    expect(tokens.matchesHash(generated.value, 'invalid')).toBe(false);
    expect(() => new OpaqueTokenAdapter(randomBytes(16), uuidService)).toThrow(RangeError);
  });
});

interface ApplicationFixture {
  readonly authenticationRepository: InMemoryAuthenticationRepository;
  readonly clock: MutableClock;
  readonly login: LoginUser;
  readonly logout: LogoutUser;
  readonly passwordAdapter: Argon2PasswordAdapter;
  readonly refresh: RefreshSession;
  readonly register: RegisterUser;
  readonly sessionRepository: InMemorySessionRepository;
  readonly tokenAdapter: OpaqueTokenAdapter;
  readonly validate: ValidateAccessToken;
}

async function createApplicationFixture(): Promise<ApplicationFixture> {
  const authenticationRepository = new InMemoryAuthenticationRepository();
  const sessionRepository = new InMemorySessionRepository();
  const unitOfWork = new InMemoryUnitOfWork();
  const clock = new MutableClock(NOW);
  const passwordAdapter = await Argon2PasswordAdapter.create(configuration.argon2);
  const tokenAdapter = new OpaqueTokenAdapter(randomBytes(32), uuidService);

  return {
    authenticationRepository,
    clock,
    login: new LoginUser({
      clock,
      configuration,
      passwordVerifier: passwordAdapter,
      repository: authenticationRepository,
      sessionRepository,
      tokenGenerator: tokenAdapter,
      unitOfWork,
      uuidService,
    }),
    logout: new LogoutUser({ clock, sessionRepository, unitOfWork, uuidService }),
    passwordAdapter,
    refresh: new RefreshSession({
      clock,
      configuration,
      sessionRepository,
      tokenGenerator: tokenAdapter,
      tokenVerifier: tokenAdapter,
      unitOfWork,
      uuidService,
    }),
    register: new RegisterUser({
      clock,
      configuration,
      passwordHasher: passwordAdapter,
      repository: authenticationRepository,
      unitOfWork,
      uuidService,
    }),
    sessionRepository,
    tokenAdapter,
    validate: new ValidateAccessToken({ clock, tokenVerifier: tokenAdapter }),
  };
}

describe('authentication application', () => {
  it('registers a user, normalizes email, hashes the password and prevents duplicates', async () => {
    const fixture = await createApplicationFixture();
    const input = { email: ' Learner@Example.COM ', password: 'Correct horse battery staple' };
    const registered = await fixture.register.execute(input);
    expect(registered.isSuccess).toBe(true);
    expect(fixture.authenticationRepository.size).toBe(1);

    const stored = await fixture.authenticationRepository.findByEmail(email());
    expect(stored?.email.value).toBe('learner@example.com');
    expect(stored?.passwordHash.reveal()).not.toContain(input.password);
    expect(stored?.pendingDomainEvents[0]?.eventName).toBe('UserRegistered');

    const duplicate = await fixture.register.execute(input);
    expect(duplicate.isSuccess).toBe(false);
    if (!duplicate.isSuccess) expect(duplicate.error).toBeInstanceOf(EmailAlreadyExistsError);
  });

  it('rejects invalid registration input and serializes duplicate attempts', async () => {
    const fixture = await createApplicationFixture();
    const invalidEmail = await fixture.register.execute({
      email: 'invalid',
      password: 'x'.repeat(20),
    });
    expect(invalidEmail.isSuccess).toBe(false);
    const weak = await fixture.register.execute({ email: 'valid@example.com', password: 'short' });
    expect(weak.isSuccess).toBe(false);
    if (!weak.isSuccess) expect(weak.error).toBeInstanceOf(WeakPasswordError);

    const input = { email: 'race@example.com', password: 'Correct horse battery staple' };
    const results = await Promise.all([
      fixture.register.execute(input),
      fixture.register.execute(input),
    ]);
    expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
    expect(results.filter((result) => !result.isSuccess)).toHaveLength(1);
  });

  it('logs in with opaque tokens, persists a session and uses generic credential errors', async () => {
    const fixture = await createApplicationFixture();
    await fixture.register.execute({
      email: 'learner@example.com',
      password: 'Correct horse battery staple',
    });
    const login = await fixture.login.execute({
      email: 'learner@example.com',
      password: 'Correct horse battery staple',
    });
    expect(login.isSuccess).toBe(true);
    expect(fixture.sessionRepository.size).toBe(1);
    if (login.isSuccess) {
      const stored = await fixture.sessionRepository.findById(login.value.sessionId);
      expect(stored?.refreshTokenHash).not.toBe(login.value.refreshToken);
      expect(stored?.pendingDomainEvents[0]?.eventName).toBe('UserLoggedIn');
    }

    for (const input of [
      { email: 'missing@example.com', password: 'Correct horse battery staple' },
      { email: 'learner@example.com', password: 'Incorrect secure password' },
      { email: 'not-an-email', password: 'Correct horse battery staple' },
    ]) {
      const failed = await fixture.login.execute(input);
      expect(failed.isSuccess).toBe(false);
      if (!failed.isSuccess) expect(failed.error).toBeInstanceOf(InvalidCredentialsError);
    }
  });

  it('rejects inactive users without changing the public error', async () => {
    const fixture = await createApplicationFixture();
    const hash = await fixture.passwordAdapter.hash(password());
    await fixture.authenticationRepository.save(
      User.rehydrate({
        active: false,
        createdAt: NOW,
        email: email(),
        id: UserId.create(uuidService.generate()),
        passwordHash: hash,
        updatedAt: NOW,
      }),
    );
    const result = await fixture.login.execute({
      email: 'learner@example.com',
      password: 'Correct horse battery staple',
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('logs out once and rejects missing or already revoked sessions', async () => {
    const fixture = await createApplicationFixture();
    const aggregate = session();
    await fixture.sessionRepository.save(aggregate);
    const first = await fixture.logout.execute({ sessionId: aggregate.id });
    expect(first.isSuccess).toBe(true);
    expect(aggregate.isRevoked()).toBe(true);
    expect(aggregate.pendingDomainEvents[0]?.eventName).toBe('UserLoggedOut');
    const repeated = await fixture.logout.execute({ sessionId: aggregate.id });
    expect(repeated.isSuccess).toBe(false);
    const missing = await fixture.logout.execute({
      sessionId: SessionId.create(uuidService.generate()),
    });
    expect(missing.isSuccess).toBe(false);
  });

  it('rotates refresh tokens and rejects replay of the previous token', async () => {
    const fixture = await createApplicationFixture();
    await fixture.register.execute({
      email: 'learner@example.com',
      password: 'Correct horse battery staple',
    });
    const login = await fixture.login.execute({
      email: 'learner@example.com',
      password: 'Correct horse battery staple',
    });
    if (!login.isSuccess) throw login.error;

    const refreshed = await fixture.refresh.execute({ refreshToken: login.value.refreshToken });
    expect(refreshed.isSuccess).toBe(true);
    if (!refreshed.isSuccess) throw refreshed.error;
    expect(refreshed.value.refreshToken).not.toBe(login.value.refreshToken);

    const replay = await fixture.refresh.execute({ refreshToken: login.value.refreshToken });
    expect(replay.isSuccess).toBe(false);
    if (!replay.isSuccess) expect(replay.error).toBeInstanceOf(InvalidSessionError);
    const stored = await fixture.sessionRepository.findById(refreshed.value.sessionId);
    expect(stored?.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'UserLoggedIn',
      'SessionRefreshed',
    ]);
  });

  it('rejects invalid, expired and revoked refresh sessions', async () => {
    const fixture = await createApplicationFixture();
    const invalid = await fixture.refresh.execute({ refreshToken: 'invalid' });
    expect(invalid.isSuccess).toBe(false);
    if (!invalid.isSuccess) expect(invalid.error).toBeInstanceOf(InvalidTokenError);

    const subject = user();
    const id = SessionId.create(uuidService.generate());
    const token = await fixture.tokenAdapter.generateRefreshToken({
      expiresAt: new Date(NOW.getTime() + 120_000),
      sessionId: id,
      userId: subject.id,
    });
    const revoked = Session.rehydrate({
      createdAt: NOW,
      expiresAt: new Date(NOW.getTime() + 120_000),
      id,
      refreshTokenHash: token.hash,
      revokedAt: NOW,
      userId: subject.id,
    });
    await fixture.sessionRepository.save(revoked);
    const revokedResult = await fixture.refresh.execute({ refreshToken: token.value });
    expect(revokedResult.isSuccess).toBe(false);
    if (!revokedResult.isSuccess) expect(revokedResult.error).toBeInstanceOf(InvalidSessionError);

    fixture.clock.set(new Date(NOW.getTime() + 120_000));
    const expired = await fixture.refresh.execute({ refreshToken: token.value });
    expect(expired.isSuccess).toBe(false);
    if (!expired.isSuccess) expect(expired.error).toBeInstanceOf(ExpiredTokenError);
  });

  it('validates access tokens solely through TokenVerifier', async () => {
    const fixture = await createApplicationFixture();
    const request = {
      expiresAt: new Date(NOW.getTime() + 60_000),
      sessionId: SessionId.create(uuidService.generate()),
      userId: UserId.create(uuidService.generate()),
    };
    const access = await fixture.tokenAdapter.generateAccessToken(request);
    const valid = await fixture.validate.execute({ accessToken: access.value });
    expect(valid.isSuccess).toBe(true);
    if (valid.isSuccess) expect(valid.value.userId.equals(request.userId)).toBe(true);

    const invalid = await fixture.validate.execute({ accessToken: 'invalid' });
    expect(invalid.isSuccess).toBe(false);
    fixture.clock.set(request.expiresAt);
    const expired = await fixture.validate.execute({ accessToken: access.value });
    expect(expired.isSuccess).toBe(false);
    if (!expired.isSuccess) expect(expired.error).toBeInstanceOf(ExpiredTokenError);
  });
});

describe('in-memory infrastructure', () => {
  it('stores aggregates by their domain keys', async () => {
    const users = new InMemoryAuthenticationRepository();
    const sessions = new InMemorySessionRepository();
    const storedUser = user();
    const storedSession = session({ userId: storedUser.id });
    await users.save(storedUser);
    await sessions.save(storedSession);
    expect(await users.findByEmail(storedUser.email)).toBe(storedUser);
    expect(await sessions.findById(storedSession.id)).toBe(storedSession);
  });

  it('serializes concurrent units of work even after a failure', async () => {
    const unitOfWork = new InMemoryUnitOfWork();
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = unitOfWork.execute(async () => {
      order.push('first:start');
      await firstGate;
      order.push('first:end');
      throw new Error('expected');
    });
    const second = unitOfWork.execute(async () => {
      order.push('second');
      return 42;
    });

    await Promise.resolve();
    expect(order).toEqual(['first:start']);
    releaseFirst?.();
    await expect(first).rejects.toThrow('expected');
    await expect(second).resolves.toBe(42);
    expect(order).toEqual(['first:start', 'first:end', 'second']);
  });
});
