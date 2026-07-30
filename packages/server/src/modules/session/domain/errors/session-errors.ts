import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class SessionError<TCode extends string = string> extends DomainError<TCode> {}

export class SessionAlreadyFinishedError extends SessionError<'session.already-finished'> {
  constructor(sessionId: string) {
    super({
      category: 'domain-conflict',
      code: 'session.already-finished',
      context: { sessionId },
      message: `The study session '${sessionId}' is already finished.`,
    });
  }
}

export class SessionNotStartedError extends SessionError<'session.not-started'> {
  constructor(sessionId: string) {
    super({
      category: 'domain-conflict',
      code: 'session.not-started',
      context: { sessionId },
      message: `The study session '${sessionId}' has not been started.`,
    });
  }
}

export class InvalidSessionTransitionError extends SessionError<'session.invalid-transition'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'session.invalid-transition',
      context: { reason },
      message: `Invalid session transition: ${reason}`,
    });
  }
}

export class SessionItemNotFoundError extends SessionError<'session.item-not-found'> {
  constructor(itemId: string) {
    super({
      category: 'not-found',
      code: 'session.item-not-found',
      context: { itemId },
      message: `The session item '${itemId}' was not found.`,
    });
  }
}

export class SessionNotFoundError extends SessionError<'session.not-found'> {
  constructor(sessionId: string) {
    super({
      category: 'not-found',
      code: 'session.not-found',
      context: { sessionId },
      message: `The study session '${sessionId}' was not found.`,
    });
  }
}

export class InvalidSessionValueError extends SessionError<'session.invalid-value'> {
  constructor(field: string, providedValue: number) {
    super({
      category: 'validation',
      code: 'session.invalid-value',
      context: { field, providedValue },
      message: `The supplied ${field} value (${providedValue}) is invalid.`,
    });
  }
}
