import type { SessionId, UserId } from '../../domain/identifiers/authentication-ids.js';
import type { Email } from '../../domain/value-objects/email.js';
import type { HashedPassword } from '../../domain/value-objects/hashed-password.js';

export interface AuthenticationAccountSnapshot {
  readonly email: Email;
  readonly passwordHash: HashedPassword;
  readonly userId: UserId;
}

export interface AuthenticationSessionSnapshot {
  readonly expiresAtEpochMilliseconds: number;
  readonly refreshTokenHash: string;
  readonly revokedAtEpochMilliseconds?: number;
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface AuthenticationRepository {
  findByEmail(email: Email): Promise<AuthenticationAccountSnapshot | undefined>;
  save(account: AuthenticationAccountSnapshot): Promise<void>;
}

export interface SessionRepository {
  findById(sessionId: SessionId): Promise<AuthenticationSessionSnapshot | undefined>;
  save(session: AuthenticationSessionSnapshot): Promise<void>;
}
