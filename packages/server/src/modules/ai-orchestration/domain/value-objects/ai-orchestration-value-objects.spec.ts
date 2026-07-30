import { describe, expect, it } from 'vitest';
import { GenerationAttempts } from './generation-attempts.js';
import { GenerationCost } from './generation-cost.js';
import { GenerationDuration } from './generation-duration.js';
import { GenerationPriority } from './generation-priority.js';
import { PromptVersion } from './prompt-version.js';

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('AI Orchestration value objects', () => {
  describe('GenerationPriority', () => {
    it('creates valid GenerationPriority and tests factory methods', () => {
      const res = GenerationPriority.create('high');
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.level).toBe('high');
        expect(res.value.weight).toBe(3);
        expect(res.value.toString()).toBe('high');
      }

      expect(GenerationPriority.low().weight).toBe(1);
      expect(GenerationPriority.medium().weight).toBe(2);
      expect(GenerationPriority.high().weight).toBe(3);
      expect(GenerationPriority.urgent().weight).toBe(4);
    });

    it('rejects invalid priority level', () => {
      expect(GenerationPriority.create('invalid').isSuccess).toBe(false);
    });
  });

  describe('GenerationAttempts', () => {
    it('handles attempts increment and retry check', () => {
      const initial = GenerationAttempts.initial(3);
      expect(initial.current).toBe(0);
      expect(initial.canRetry).toBe(true);

      const inc1 = unwrap(initial.increment());
      expect(inc1.current).toBe(1);

      const maxAttempts = unwrap(GenerationAttempts.create(3, 3));
      expect(maxAttempts.canRetry).toBe(false);
    });

    it('rejects negative or invalid attempts', () => {
      expect(GenerationAttempts.create(-1, 3).isSuccess).toBe(false);
      expect(GenerationAttempts.create(0, 0).isSuccess).toBe(false);
    });
  });

  describe('PromptVersion', () => {
    it('creates valid PromptVersion', () => {
      const res = PromptVersion.create('v2.1.0');
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.version).toBe('v2.1.0');
        expect(res.value.toString()).toBe('v2.1.0');
      }

      expect(PromptVersion.default().version).toBe('v1.0.0');
    });

    it('rejects empty prompt version', () => {
      expect(PromptVersion.create('').isSuccess).toBe(false);
    });
  });

  describe('GenerationCost', () => {
    it('creates valid GenerationCost', () => {
      const res = GenerationCost.create(500, 0.005);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.tokensUsed).toBe(500);
        expect(res.value.estimatedCostUSD).toBe(0.005);
      }

      expect(GenerationCost.zero().tokensUsed).toBe(0);
    });

    it('rejects invalid token count or negative cost', () => {
      expect(GenerationCost.create(-10, 0.01).isSuccess).toBe(false);
      expect(GenerationCost.create(100, -0.01).isSuccess).toBe(false);
    });
  });

  describe('GenerationDuration', () => {
    it('creates valid GenerationDuration', () => {
      const res = GenerationDuration.create(2500);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.durationMs).toBe(2500);
        expect(res.value.inSeconds).toBe(2.5);
      }

      expect(GenerationDuration.zero().durationMs).toBe(0);
    });

    it('calculates duration between dates', () => {
      const start = new Date('2026-07-22T00:00:00.000Z');
      const end = new Date('2026-07-22T00:00:05.000Z');
      const res = GenerationDuration.between(start, end);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.inSeconds).toBe(5);
      }
    });
  });
});
