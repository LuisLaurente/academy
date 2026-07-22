import type { Uuid } from '../../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../../core/result/result.js';
import { AggregateRoot } from '../../../../../domain/aggregates/aggregate-root.js';
import type { DomainEventMetadata } from '../../../../../domain/events/domain-event.js';
import {
  ExpiredTokenError,
  InvalidAuthenticationStateError,
  InvalidSessionError,
} from '../errors/authentication-errors.js';
import {
  SessionRefreshed,
  UserLoggedIn,
  UserLoggedOut,
  UserRegistered,
} from '../events/authentication-events.js';
import { type SessionId, type UserId } from '../identifiers/authentication-ids.js';
import type { Email } from '../value-objects/email.js';
import type { HashedPassword } from '../value-objects/hashed-password.js';

interface UserState {
  readonly active: boolean;
  readonly createdAt: Date;
  readonly email: Email;
  readonly id: UserId;
  readonly passwordHash: HashedPassword;
  readonly updatedAt: Date;
}

interface RegisterUserState extends UserState {
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
}

export class User extends AggregateRoot<UserId> {
  readonly active: boolean;
  readonly email: Email;
  readonly passwordHash: HashedPassword;

  readonly #createdAtEpochMilliseconds: number;
  readonly #updatedAtEpochMilliseconds: number;

  private constructor(state: UserState) {
    super(state.id);
    assertValidDate(state.createdAt, 'createdAt');
    assertValidDate(state.updatedAt, 'updatedAt');

    if (state.updatedAt.getTime() < state.createdAt.getTime()) {
      throw new InvalidAuthenticationStateError('updatedAt precedes createdAt');
    }

    this.active = state.active;
    this.email = state.email;
    this.passwordHash = state.passwordHash;
    this.#createdAtEpochMilliseconds = state.createdAt.getTime();
    this.#updatedAtEpochMilliseconds = state.updatedAt.getTime();
  }

  static register(state: RegisterUserState): User {
    const user = new User(state);
    user.recordDomainEvent(
      new UserRegistered({
        aggregateId: user.id,
        aggregateVersion: 1,
        eventId: state.eventId,
        ...(state.metadata === undefined ? {} : { metadata: state.metadata }),
        occurredAt: state.createdAt,
      }),
    );
    return user;
  }

  static rehydrate(state: UserState): User {
    return new User(state);
  }

  get createdAt(): Date {
    return new Date(this.#createdAtEpochMilliseconds);
  }

  get updatedAt(): Date {
    return new Date(this.#updatedAtEpochMilliseconds);
  }
}

interface SessionState {
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly id: SessionId;
  readonly refreshTokenHash: string;
  readonly revokedAt?: Date;
  readonly userId: UserId;
}

interface StartSessionState extends SessionState {
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
}

interface SessionTransition {
  readonly at: Date;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
}

interface RefreshSessionTransition extends SessionTransition {
  readonly expiresAt: Date;
  readonly refreshTokenHash: string;
}

export class Session extends AggregateRoot<SessionId> {
  readonly userId: UserId;

  #expiresAtEpochMilliseconds: number;
  #refreshTokenHash: string;
  #revokedAtEpochMilliseconds: number | undefined;
  readonly #createdAtEpochMilliseconds: number;

  private constructor(state: SessionState) {
    super(state.id);
    assertValidDate(state.createdAt, 'createdAt');
    assertValidDate(state.expiresAt, 'expiresAt');
    assertTokenHash(state.refreshTokenHash);

    if (state.expiresAt.getTime() <= state.createdAt.getTime()) {
      throw new InvalidAuthenticationStateError('expiresAt must follow createdAt');
    }

    if (state.revokedAt !== undefined) {
      assertValidDate(state.revokedAt, 'revokedAt');
      if (state.revokedAt.getTime() < state.createdAt.getTime()) {
        throw new InvalidAuthenticationStateError('revokedAt precedes createdAt');
      }
    }

    this.userId = state.userId;
    this.#createdAtEpochMilliseconds = state.createdAt.getTime();
    this.#expiresAtEpochMilliseconds = state.expiresAt.getTime();
    this.#refreshTokenHash = state.refreshTokenHash;
    this.#revokedAtEpochMilliseconds = state.revokedAt?.getTime();
  }

  static start(state: StartSessionState): Session {
    const session = new Session(state);
    session.recordDomainEvent(
      new UserLoggedIn({
        aggregateId: session.id,
        aggregateVersion: 1,
        eventId: state.eventId,
        ...(state.metadata === undefined ? {} : { metadata: state.metadata }),
        occurredAt: state.createdAt,
        userId: state.userId,
      }),
    );
    return session;
  }

  static rehydrate(state: SessionState): Session {
    return new Session(state);
  }

  get createdAt(): Date {
    return new Date(this.#createdAtEpochMilliseconds);
  }

  get expiresAt(): Date {
    return new Date(this.#expiresAtEpochMilliseconds);
  }

  get refreshTokenHash(): string {
    return this.#refreshTokenHash;
  }

  get revokedAt(): Date | undefined {
    return this.#revokedAtEpochMilliseconds === undefined
      ? undefined
      : new Date(this.#revokedAtEpochMilliseconds);
  }

  isExpired(at: Date): boolean {
    assertValidDate(at, 'comparison time');
    return at.getTime() >= this.#expiresAtEpochMilliseconds;
  }

  isRevoked(): boolean {
    return this.#revokedAtEpochMilliseconds !== undefined;
  }

  revoke(transition: SessionTransition): ResultType<void, InvalidSessionError> {
    assertValidDate(transition.at, 'revocation time');
    if (this.isRevoked()) {
      return Result.failure(new InvalidSessionError());
    }

    this.#revokedAtEpochMilliseconds = transition.at.getTime();
    this.recordDomainEvent(
      new UserLoggedOut({
        aggregateId: this.id,
        aggregateVersion: 1,
        eventId: transition.eventId,
        ...(transition.metadata === undefined ? {} : { metadata: transition.metadata }),
        occurredAt: transition.at,
        userId: this.userId,
      }),
    );
    return Result.success(undefined);
  }

  rotateRefreshToken(
    transition: RefreshSessionTransition,
  ): ResultType<void, ExpiredTokenError | InvalidSessionError> {
    assertValidDate(transition.at, 'refresh time');
    assertValidDate(transition.expiresAt, 'new expiration time');
    assertTokenHash(transition.refreshTokenHash);

    if (this.isRevoked()) {
      return Result.failure(new InvalidSessionError());
    }
    if (this.isExpired(transition.at)) {
      return Result.failure(new ExpiredTokenError());
    }
    if (transition.expiresAt.getTime() <= transition.at.getTime()) {
      throw new InvalidAuthenticationStateError('new expiresAt must follow refresh time');
    }

    this.#refreshTokenHash = transition.refreshTokenHash;
    this.#expiresAtEpochMilliseconds = transition.expiresAt.getTime();
    this.recordDomainEvent(
      new SessionRefreshed({
        aggregateId: this.id,
        aggregateVersion: 1,
        eventId: transition.eventId,
        ...(transition.metadata === undefined ? {} : { metadata: transition.metadata }),
        occurredAt: transition.at,
        userId: this.userId,
      }),
    );
    return Result.success(undefined);
  }
}

function assertValidDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new InvalidAuthenticationStateError(`${field} is invalid`);
  }
}

function assertTokenHash(value: string): void {
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new InvalidAuthenticationStateError('refreshTokenHash must be a SHA-256 digest');
  }
}
