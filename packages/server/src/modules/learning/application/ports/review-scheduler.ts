import type { LearningRecord } from '../../domain/aggregates/learning-record.js';
import type { ReviewInterval } from '../../domain/value-objects/review-interval.js';

export interface ScheduledReviewResult {
  readonly interval: ReviewInterval;
  readonly nextReviewAt: Date;
}

export interface ReviewScheduler {
  calculateNextReview(
    record: LearningRecord,
    lastPerformance: { readonly score?: number | undefined; readonly success: boolean },
    now?: Date | undefined,
  ): ScheduledReviewResult;
}
