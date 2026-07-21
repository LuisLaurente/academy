import { describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import {
  EmailAlreadyExistsError,
  ExpiredTokenError,
  InvalidCredentialsError,
  InvalidSessionError,
  WeakPasswordError,
} from './errors/authentication-errors.js';
import {
  SessionRefreshed,
  UserLoggedIn,
  UserLoggedOut,
  UserRegistered,
} from './events/authentication-events.js';
import { SessionId, UserId } from './identifiers/authentication-ids.js';

const uuidService = new CryptoUuidService();

describe('authentication errors', () => {
  it.each([
    [new InvalidCredentialsError(), 'authentication.invalid-credentials', 'validation'],
    [new EmailAlreadyExistsError(), 'authentication.email-already-exists', 'domain-conflict'],
    [new WeakPasswordError(12), 'authentication.weak-password', 'validation'],
    [new InvalidSessionError(), 'authentication.invalid-session', 'validation'],
    [new ExpiredTokenError(), 'authentication.expired-token', 'validation'],
  ] as const)('provides stable code and category', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).not.toContain('@');
  });
});

describe('authentication event contracts', () => {
  const userId = UserId.create(uuidService.generate());
  const sessionId = SessionId.create(uuidService.generate());
  const envelope = {
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt: new Date('2026-07-21T20:00:00.000Z'),
  } as const;

  it('creates a minimal UserRegistered event without personal data', () => {
    const event = new UserRegistered({ ...envelope, aggregateId: userId });

    expect(event.eventName).toBe('UserRegistered');
    expect(event.aggregateType).toBe('User');
    expect(event.eventVersion).toBe(1);
    expect(event.payload).toEqual({});
  });

  it.each([
    ['UserLoggedIn', UserLoggedIn],
    ['UserLoggedOut', UserLoggedOut],
    ['SessionRefreshed', SessionRefreshed],
  ] as const)('creates a minimal %s session event', (eventName, EventContract) => {
    const event = new EventContract({ ...envelope, aggregateId: sessionId, userId });

    expect(event.eventName).toBe(eventName);
    expect(event.aggregateType).toBe('Session');
    expect(event.aggregateId).toBe(sessionId);
    expect(event.payload).toEqual({ userId: userId.toString() });
    expect(Object.isFrozen(event)).toBe(true);
  });
});
