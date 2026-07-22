import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class LearningError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidMasteryScoreError extends LearningError<'learning.invalid-mastery-score'> {
  constructor(providedScore: number) {
    super({
      category: 'validation',
      code: 'learning.invalid-mastery-score',
      context: { providedScore },
      message: `The supplied mastery score (${providedScore}) is invalid. Must be between 0.0 and 1.0.`,
    });
  }
}

export class InvalidLearningTransitionError extends LearningError<'learning.invalid-transition'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'learning.invalid-transition',
      context: { reason },
      message: `Invalid learning state transition: ${reason}`,
    });
  }
}

export class ReviewNotDueError extends LearningError<'learning.review-not-due'> {
  constructor(nextReviewAt: Date, currentAt: Date) {
    super({
      category: 'domain-conflict',
      code: 'learning.review-not-due',
      context: { currentAt: currentAt.toISOString(), nextReviewAt: nextReviewAt.toISOString() },
      message: `Review is not due yet. Scheduled for ${nextReviewAt.toISOString()}, current time is ${currentAt.toISOString()}.`,
    });
  }
}

export class LearningRecordLockedError extends LearningError<'learning.record-locked'> {
  constructor(recordId: string) {
    super({
      category: 'domain-conflict',
      code: 'learning.record-locked',
      context: { recordId },
      message: `The learning record '${recordId}' is locked and cannot be updated.`,
    });
  }
}

export class LearningRecordNotFoundError extends LearningError<'learning.record-not-found'> {
  constructor(recordId: string) {
    super({
      category: 'not-found',
      code: 'learning.record-not-found',
      context: { recordId },
      message: `The learning record '${recordId}' was not found.`,
    });
  }
}

export class InvalidScoreValueError extends LearningError<'learning.invalid-score-value'> {
  constructor(field: string, providedValue: number) {
    super({
      category: 'validation',
      code: 'learning.invalid-score-value',
      context: { field, providedValue },
      message: `The supplied ${field} score (${providedValue}) is invalid. Must be between 0.0 and 1.0.`,
    });
  }
}

export class InvalidAttemptCountError extends LearningError<'learning.invalid-attempt-count'> {
  constructor(providedValue: number) {
    super({
      category: 'validation',
      code: 'learning.invalid-attempt-count',
      context: { providedValue },
      message: `The supplied attempt count (${providedValue}) is invalid. Must be a non-negative integer.`,
    });
  }
}

export class InvalidReviewIntervalError extends LearningError<'learning.invalid-review-interval'> {
  constructor(providedValue: number) {
    super({
      category: 'validation',
      code: 'learning.invalid-review-interval',
      context: { providedValue },
      message: `The supplied review interval (${providedValue}) is invalid. Must be a non-negative number.`,
    });
  }
}
