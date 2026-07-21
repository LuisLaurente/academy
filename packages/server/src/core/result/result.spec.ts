import { describe, expect, it, vi } from 'vitest';

import { Result, type Result as ResultType } from './result.js';

describe('Result', () => {
  it('creates frozen success and failure values', () => {
    const success = Result.success(42);
    const failure = Result.failure('invalid');

    expect(success).toEqual({ isSuccess: true, value: 42 });
    expect(failure).toEqual({ error: 'invalid', isSuccess: false });
    expect(Object.isFrozen(success)).toBe(true);
    expect(Object.isFrozen(failure)).toBe(true);
  });

  it('maps only a successful value', () => {
    const mapper = vi.fn((value: number) => value * 2);

    expect(Result.map(Result.success(21), mapper)).toEqual(Result.success(42));
    expect(Result.map(Result.failure('invalid'), mapper)).toEqual(Result.failure('invalid'));
    expect(mapper).toHaveBeenCalledOnce();
  });

  it('maps only a failure', () => {
    const mapper = vi.fn((error: string) => ({ reason: error }));

    expect(Result.mapError(Result.failure('invalid'), mapper)).toEqual(
      Result.failure({ reason: 'invalid' }),
    );
    expect(Result.mapError(Result.success(42), mapper)).toEqual(Result.success(42));
    expect(mapper).toHaveBeenCalledOnce();
  });

  it('chains successful operations and preserves either error type', () => {
    const parsePositive = (value: string): ResultType<number, 'not-positive' | 'not-number'> => {
      const parsedValue = Number(value);

      if (Number.isNaN(parsedValue)) {
        return Result.failure('not-number');
      }

      return parsedValue > 0 ? Result.success(parsedValue) : Result.failure('not-positive');
    };

    expect(Result.flatMap(Result.success('4'), parsePositive)).toEqual(Result.success(4));
    expect(Result.flatMap(Result.success('-1'), parsePositive)).toEqual(
      Result.failure('not-positive'),
    );
    expect(Result.flatMap(Result.failure('missing'), parsePositive)).toEqual(
      Result.failure('missing'),
    );
  });

  it('matches exactly one result branch', () => {
    const matcher = {
      failure: vi.fn((error: string) => `error:${error}`),
      success: vi.fn((value: number) => `value:${value}`),
    };

    expect(Result.match(Result.success(7), matcher)).toBe('value:7');
    expect(matcher.success).toHaveBeenCalledOnce();
    expect(matcher.failure).not.toHaveBeenCalled();
  });

  it('returns a fallback without evaluating exceptional accessors', () => {
    expect(Result.unwrapOr(Result.success(7), 0)).toBe(7);
    expect(Result.unwrapOr(Result.failure('invalid'), 0)).toBe(0);
  });
});
