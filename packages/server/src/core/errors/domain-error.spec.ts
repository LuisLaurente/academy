import { describe, expect, it } from 'vitest';

import { DomainError } from './domain-error.js';

class TestRuleViolationError extends DomainError<'test.rule-violated'> {
  constructor(cause?: unknown) {
    super({
      category: 'domain-conflict',
      ...(cause === undefined ? {} : { cause }),
      code: 'test.rule-violated',
      context: { aggregateId: 'aggregate-1', retryable: false },
      message: 'The test rule was violated.',
    });
  }
}

describe('DomainError', () => {
  it('preserves stable semantic metadata and the original cause', () => {
    const cause = new Error('original');
    const error = new TestRuleViolationError(cause);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TestRuleViolationError');
    expect(error.code).toBe('test.rule-violated');
    expect(error.category).toBe('domain-conflict');
    expect(error.message).toBe('The test rule was violated.');
    expect(error.cause).toBe(cause);
    expect(error.context).toEqual({ aggregateId: 'aggregate-1', retryable: false });
    expect(Object.isFrozen(error.context)).toBe(true);
  });
});
