import type { Session, User } from '../../domain/aggregates/authentication-aggregates.js';
import type { SessionId } from '../../domain/identifiers/authentication-ids.js';
import type { Email } from '../../domain/value-objects/email.js';

export interface AuthenticationRepository {
  findByEmail(email: Email): Promise<User | undefined>;
  save(user: User): Promise<void>;
}

export interface SessionRepository {
  findById(sessionId: SessionId): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
}
