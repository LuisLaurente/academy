import { describe, expect, it } from 'vitest';
import {
  InvalidSessionTransitionError,
  InvalidSessionValueError,
  SessionAlreadyFinishedError,
  SessionItemNotFoundError,
  SessionNotFoundError,
  SessionNotStartedError,
} from './session-errors.js';

describe('session domain errors', () => {
  it.each([
    [new SessionAlreadyFinishedError('s-1'), 'session.already-finished', 'domain-conflict'],
    [new SessionNotStartedError('s-2'), 'session.not-started', 'domain-conflict'],
    [new InvalidSessionTransitionError('cannot skip'), 'session.invalid-transition', 'validation'],
    [new SessionItemNotFoundError('item-1'), 'session.item-not-found', 'not-found'],
    [new SessionNotFoundError('s-99'), 'session.not-found', 'not-found'],
    [new InvalidSessionValueError('duration', -10), 'session.invalid-value', 'validation'],
  ] as const)('provides stable code and category for %s', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).toBeTruthy();
  });
});
