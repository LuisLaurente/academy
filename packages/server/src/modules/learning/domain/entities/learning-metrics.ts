import { Entity } from '../../../../domain/entities/entity.js';
import type { LearningMetricsId } from '../identifiers/learning-ids.js';

export interface CreateLearningMetricsProps {
  readonly averageResponseTimeMs?: number | null;
  readonly consecutiveFailures?: number;
  readonly consecutiveSuccesses?: number;
  readonly currentStreak?: number;
  readonly id: LearningMetricsId;
  readonly lastAttemptSuccess?: boolean | null;
  readonly longestStreak?: number;
  readonly totalReviews?: number;
}

export class LearningMetrics extends Entity<LearningMetricsId> {
  readonly totalReviews: number;
  readonly consecutiveSuccesses: number;
  readonly consecutiveFailures: number;
  readonly averageResponseTimeMs: number | null;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly lastAttemptSuccess: boolean | null;

  private constructor(props: CreateLearningMetricsProps) {
    super(props.id);
    this.totalReviews = props.totalReviews ?? 0;
    this.consecutiveSuccesses = props.consecutiveSuccesses ?? 0;
    this.consecutiveFailures = props.consecutiveFailures ?? 0;
    this.averageResponseTimeMs = props.averageResponseTimeMs ?? null;
    this.currentStreak = props.currentStreak ?? 0;
    this.longestStreak = props.longestStreak ?? 0;
    this.lastAttemptSuccess = props.lastAttemptSuccess ?? null;
    Object.freeze(this);
  }

  static create(props: CreateLearningMetricsProps): LearningMetrics {
    return new LearningMetrics(props);
  }

  static empty(id: LearningMetricsId): LearningMetrics {
    return new LearningMetrics({ id });
  }

  recordAttempt(success: boolean, responseTimeMs?: number): LearningMetrics {
    const newTotal = this.totalReviews + 1;
    const newConsecutiveSuccesses = success ? this.consecutiveSuccesses + 1 : 0;
    const newConsecutiveFailures = success ? 0 : this.consecutiveFailures + 1;
    const newCurrentStreak = success ? this.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(this.longestStreak, newCurrentStreak);

    let newAvgResponseTime = this.averageResponseTimeMs;
    if (responseTimeMs !== undefined && Number.isFinite(responseTimeMs) && responseTimeMs >= 0) {
      if (this.averageResponseTimeMs === null) {
        newAvgResponseTime = responseTimeMs;
      } else {
        newAvgResponseTime = Number(
          ((this.averageResponseTimeMs * this.totalReviews + responseTimeMs) / newTotal).toFixed(2),
        );
      }
    }

    return new LearningMetrics({
      averageResponseTimeMs: newAvgResponseTime,
      consecutiveFailures: newConsecutiveFailures,
      consecutiveSuccesses: newConsecutiveSuccesses,
      currentStreak: newCurrentStreak,
      id: this.id,
      lastAttemptSuccess: success,
      longestStreak: newLongestStreak,
      totalReviews: newTotal,
    });
  }
}
