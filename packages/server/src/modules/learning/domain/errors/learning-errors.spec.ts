import { describe, expect, it } from 'vitest';
import {
  InvalidAttemptCountError,
  InvalidLearningTransitionError,
  InvalidMasteryScoreError,
  InvalidReviewIntervalError,
  InvalidScoreValueError,
  LearningRecordLockedError,
  LearningRecordNotFoundError,
  ReviewNotDueError,
} from './learning-errors.js';

describe('learning domain errors', () => {
  it.each([
    [new InvalidMasteryScoreError(1.5), 'learning.invalid-mastery-score', 'validation'],
    [
      new InvalidLearningTransitionError('invalid state'),
      'learning.invalid-transition',
      'validation',
    ],
    [
      new ReviewNotDueError(new Date('2026-10-01'), new Date('2026-09-01')),
      'learning.review-not-due',
      'domain-conflict',
    ],
    [new LearningRecordLockedError('rec-123'), 'learning.record-locked', 'domain-conflict'],
    [new LearningRecordNotFoundError('rec-123'), 'learning.record-not-found', 'not-found'],
    [new InvalidScoreValueError('confidence', -0.1), 'learning.invalid-score-value', 'validation'],
    [new InvalidAttemptCountError(-5), 'learning.invalid-attempt-count', 'validation'],
    [new InvalidReviewIntervalError(-2), 'learning.invalid-review-interval', 'validation'],
  ] as const)('provides consistent code and category for %s', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).toBeTruthy();
  });
});
