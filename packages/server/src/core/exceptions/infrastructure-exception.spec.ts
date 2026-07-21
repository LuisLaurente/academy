import { describe, expect, it } from 'vitest';

import {
  PermanentInfrastructureException,
  TransientInfrastructureException,
} from './infrastructure-exception.js';

class TestTransientException extends TransientInfrastructureException<'test.timeout'> {
  constructor() {
    super({ code: 'test.timeout', message: 'The dependency timed out.' });
  }
}

class TestPermanentException extends PermanentInfrastructureException<'test.contract-invalid'> {
  constructor() {
    super({ code: 'test.contract-invalid', message: 'The dependency contract is invalid.' });
  }
}

describe('InfrastructureException', () => {
  it('marks transient failures as retryable', () => {
    const exception = new TestTransientException();

    expect(exception.category).toBe('dependency-transient');
    expect(exception.isRetryable).toBe(true);
  });

  it('marks permanent failures as non-retryable', () => {
    const exception = new TestPermanentException();

    expect(exception.category).toBe('dependency-permanent');
    expect(exception.isRetryable).toBe(false);
  });
});
