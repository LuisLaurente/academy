import { describe, expect, it } from 'vitest';
import {
  GenerationAlreadyCompletedError,
  GenerationAlreadyRunningError,
  GenerationLimitExceededError,
  GenerationRequestNotFoundError,
  InvalidGenerationTransitionError,
  InvalidGenerationValueError,
} from './ai-orchestration-errors.js';

describe('AI Orchestration domain errors', () => {
  it.each([
    [
      new InvalidGenerationTransitionError('invalid state'),
      'ai-orchestration.invalid-transition',
      'validation',
    ],
    [
      new GenerationAlreadyCompletedError('req-1'),
      'ai-orchestration.already-completed',
      'domain-conflict',
    ],
    [
      new GenerationAlreadyRunningError('req-2'),
      'ai-orchestration.already-running',
      'domain-conflict',
    ],
    [
      new GenerationLimitExceededError('req-3', 3),
      'ai-orchestration.limit-exceeded',
      'domain-conflict',
    ],
    [
      new GenerationRequestNotFoundError('req-99'),
      'ai-orchestration.request-not-found',
      'not-found',
    ],
    [
      new InvalidGenerationValueError('priority', 'super-high'),
      'ai-orchestration.invalid-value',
      'validation',
    ],
  ] as const)('provides stable code and category for %s', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).toBeTruthy();
  });
});
