import type { LearningRecord } from '../domain/aggregates/learning-record.js';
import type { MasteryCalculator } from '../application/ports/mastery-calculator.js';
import type { RetentionCalculator } from '../application/ports/retention-calculator.js';
import type {
  ReviewScheduler,
  ScheduledReviewResult,
} from '../application/ports/review-scheduler.js';
import type { LearningPolicy } from '../application/ports/learning-policy.js';
import { MasteryScore } from '../domain/value-objects/mastery-score.js';
import { RetentionScore } from '../domain/value-objects/retention-score.js';
import { ReviewInterval } from '../domain/value-objects/review-interval.js';

export class DefaultMasteryCalculator implements MasteryCalculator {
  calculateMastery(
    record: LearningRecord,
    lastAttempt: { readonly score?: number; readonly success: boolean },
  ): MasteryScore {
    const current = record.mastery.value;
    const performanceScore = lastAttempt.score ?? (lastAttempt.success ? 1.0 : 0.0);
    // Simple deterministic formula: current * 0.7 + performance * 0.3
    const newScore = Math.min(1.0, Math.max(0.0, current * 0.7 + performanceScore * 0.3));
    const result = MasteryScore.create(newScore);
    return result.isSuccess ? result.value : record.mastery;
  }
}

export class DefaultRetentionCalculator implements RetentionCalculator {
  calculateRetention(record: LearningRecord, now: Date): RetentionScore {
    if (!record.lastReviewedAt) {
      return record.retention;
    }

    const elapsedDays = (now.getTime() - record.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (elapsedDays <= 0) {
      return RetentionScore.max();
    }

    // Simple deterministic decay: initial_mastery * (0.95 ^ days)
    const currentMastery = record.mastery.value;
    const retentionVal = Math.min(1.0, Math.max(0.0, currentMastery * Math.pow(0.95, elapsedDays)));
    const result = RetentionScore.create(retentionVal);
    return result.isSuccess ? result.value : RetentionScore.zero();
  }
}

export class DefaultReviewScheduler implements ReviewScheduler {
  calculateNextReview(
    record: LearningRecord,
    lastPerformance: { readonly score?: number; readonly success: boolean },
    now = new Date(),
  ): ScheduledReviewResult {
    let days = 1;
    if (lastPerformance.success) {
      const streak = record.metrics.consecutiveSuccesses + 1;
      days = Math.min(30, Math.max(1, Math.round(Math.pow(2, streak - 1))));
    } else {
      days = 1;
    }

    const intervalRes = ReviewInterval.fromDays(days);
    const interval = intervalRes.isSuccess ? intervalRes.value : ReviewInterval.zero();
    const nextReviewAt = new Date(now.getTime() + interval.inMilliseconds);

    return { interval, nextReviewAt };
  }
}

export class DefaultLearningPolicy implements LearningPolicy {
  canUpdateProgress(record: LearningRecord): boolean {
    return !record.locked;
  }

  shouldScheduleReview(record: LearningRecord, now: Date): boolean {
    return record.isReviewDue(now);
  }
}
