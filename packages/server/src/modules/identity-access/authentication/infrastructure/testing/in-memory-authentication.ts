import type { UnitOfWork } from '../../../../../domain/transactions/unit-of-work.js';
import type {
  AuthenticationRepository,
  SessionRepository,
} from '../../application/ports/authentication-repositories.js';
import type { Session, User } from '../../domain/aggregates/authentication-aggregates.js';
import type { SessionId } from '../../domain/identifiers/authentication-ids.js';
import type { Email } from '../../domain/value-objects/email.js';

export class InMemoryAuthenticationRepository implements AuthenticationRepository {
  readonly #usersByEmail = new Map<string, User>();

  findByEmail(email: Email): Promise<User | undefined> {
    return Promise.resolve(this.#usersByEmail.get(email.value));
  }

  save(user: User): Promise<void> {
    this.#usersByEmail.set(user.email.value, user);
    return Promise.resolve();
  }

  get size(): number {
    return this.#usersByEmail.size;
  }
}

export class InMemorySessionRepository implements SessionRepository {
  readonly #sessionsById = new Map<string, Session>();

  findById(sessionId: SessionId): Promise<Session | undefined> {
    return Promise.resolve(this.#sessionsById.get(sessionId.toString()));
  }

  save(session: Session): Promise<void> {
    this.#sessionsById.set(session.id.toString(), session);
    return Promise.resolve();
  }

  get size(): number {
    return this.#sessionsById.size;
  }
}

export class InMemoryUnitOfWork implements UnitOfWork {
  #pending: Promise<void> = Promise.resolve();

  execute<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    const execution = this.#pending.then(work, work);
    this.#pending = execution.then(
      () => undefined,
      () => undefined,
    );
    return execution;
  }
}
