import { describe, expect, it } from 'vitest';
import {
  InvalidRecommendationScoreError,
  InvalidRecommendationStateError,
  RecommendationAlreadyConsumedError,
  RecommendationExpiredError,
  RecommendationGenerationError,
  RecommendationNotFoundError,
} from './recommendation-errors.js';

describe('recommendation domain errors', () => {
  it.each([
    [
      new InvalidRecommendationScoreError('priority', 1.5),
      'recommendation.invalid-score',
      'validation',
    ],
    [
      new RecommendationExpiredError('set-1', new Date('2026-07-21T00:00:00.000Z')),
      'recommendation.expired',
      'domain-conflict',
    ],
    [
      new RecommendationAlreadyConsumedError('rec-1'),
      'recommendation.already-consumed',
      'domain-conflict',
    ],
    [
      new RecommendationGenerationError('No candidates'),
      'recommendation.generation-failed',
      'domain-conflict',
    ],
    [new RecommendationNotFoundError('rec-99'), 'recommendation.not-found', 'not-found'],
    [
      new InvalidRecommendationStateError('invalid transition'),
      'recommendation.invalid-state',
      'validation',
    ],
  ] as const)('provides stable code and category for %s', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).toBeTruthy();
  });
});
