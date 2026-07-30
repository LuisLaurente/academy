import { describe, expect, it } from 'vitest';
import { CompletedCount } from './completed-count.js';
import { CompletionRate } from './completion-rate.js';
import { SessionDuration } from './session-duration.js';
import { SessionProgress } from './session-progress.js';
import { SkippedCount } from './skipped-count.js';

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('session value objects', () => {
  describe('SessionDuration', () => {
    it('creates valid SessionDuration and tests conversions', () => {
      const res = SessionDuration.create(120000);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.inMilliseconds).toBe(120000);
        expect(res.value.inSeconds).toBe(120);
        expect(res.value.inMinutes).toBe(2);
        expect(res.value.toString()).toBe('2 mins');
      }

      const zero = SessionDuration.zero();
      expect(zero.inMilliseconds).toBe(0);
    });

    it('calculates duration between two dates', () => {
      const start = new Date('2026-07-22T00:00:00.000Z');
      const end = new Date('2026-07-22T00:15:00.000Z');
      const res = SessionDuration.between(start, end);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.inMinutes).toBe(15);
      }
    });

    it('rejects negative or non-finite duration', () => {
      expect(SessionDuration.create(-500).isSuccess).toBe(false);
      expect(SessionDuration.create(NaN).isSuccess).toBe(false);
    });
  });

  describe('CompletionRate', () => {
    it('creates valid CompletionRate and tests calculation from counts', () => {
      const res = CompletionRate.create(0.75);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.75);
        expect(res.value.percentage).toBe(75);
        expect(res.value.toString()).toBe('75%');
      }

      const rateFromCounts = CompletionRate.fromCounts(3, 4);
      expect(rateFromCounts.value).toBe(0.75);

      expect(CompletionRate.zero().value).toBe(0);
      expect(CompletionRate.full().value).toBe(1);
    });

    it('rejects values outside [0, 1]', () => {
      expect(CompletionRate.create(-0.1).isSuccess).toBe(false);
      expect(CompletionRate.create(1.5).isSuccess).toBe(false);
    });
  });

  describe('CompletedCount & SkippedCount', () => {
    it('handles CompletedCount increment and validations', () => {
      const res = CompletedCount.create(2);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        const inc = res.value.increment();
        expect(inc.value).toBe(3);
        expect(inc.toString()).toBe('3');
      }

      expect(CompletedCount.zero().value).toBe(0);
      expect(CompletedCount.create(-1).isSuccess).toBe(false);
    });

    it('handles SkippedCount increment and validations', () => {
      const res = SkippedCount.create(1);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        const inc = res.value.increment();
        expect(inc.value).toBe(2);
      }

      expect(SkippedCount.zero().value).toBe(0);
      expect(SkippedCount.create(-2).isSuccess).toBe(false);
    });
  });

  describe('SessionProgress', () => {
    it('creates SessionProgress and evaluates completion state', () => {
      const completedCount = unwrap(CompletedCount.create(3));
      const skippedCount = unwrap(SkippedCount.create(1));

      const progress = SessionProgress.create({
        completedCount,
        currentItemIndex: 4,
        skippedCount,
        totalCount: 4,
      });

      expect(progress.isComplete).toBe(true);
      expect(progress.completionRate.percentage).toBe(75);
      expect(progress.toString()).toBe('3/4 completed (75%)');
    });
  });
});
