import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { LearningMetricsId, ReviewHistoryId } from '../identifiers/learning-ids.js';
import { ConfidenceScore } from '../value-objects/confidence-score.js';
import { MasteryScore } from '../value-objects/mastery-score.js';
import { RetentionScore } from '../value-objects/retention-score.js';
import { ReviewInterval } from '../value-objects/review-interval.js';
import { LearningMetrics } from './learning-metrics.js';
import { ReviewHistory } from './review-history.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('learning domain entities', () => {
  describe('ReviewHistory', () => {
    it('creates ReviewHistory entity', () => {
      const historyId = ReviewHistoryId.create(uuidService.generate());
      const now = new Date();

      const history = ReviewHistory.create({
        confidenceAfter: unwrap(ConfidenceScore.create(0.8)),
        confidenceBefore: unwrap(ConfidenceScore.create(0.5)),
        id: historyId,
        intervalAfter: unwrap(ReviewInterval.create(2)),
        intervalBefore: unwrap(ReviewInterval.create(1)),
        masteryAfter: unwrap(MasteryScore.create(0.7)),
        masteryBefore: unwrap(MasteryScore.create(0.4)),
        responseTimeMs: 1500,
        retentionAfter: unwrap(RetentionScore.create(0.95)),
        retentionBefore: unwrap(RetentionScore.create(0.8)),
        reviewedAt: now,
        score: 1.0,
        success: true,
      });

      expect(history.id.equals(historyId)).toBe(true);
      expect(history.success).toBe(true);
      expect(history.score).toBe(1.0);
      expect(history.responseTimeMs).toBe(1500);
      expect(history.reviewedAt).toEqual(now);
    });
  });

  describe('LearningMetrics', () => {
    it('records attempts and computes streaks/averages correctly', () => {
      const metricsId = LearningMetricsId.create(uuidService.generate());
      let metrics = LearningMetrics.empty(metricsId);

      expect(metrics.totalReviews).toBe(0);
      expect(metrics.consecutiveSuccesses).toBe(0);
      expect(metrics.consecutiveFailures).toBe(0);

      // Record first successful attempt
      metrics = metrics.recordAttempt(true, 1000);
      expect(metrics.totalReviews).toBe(1);
      expect(metrics.consecutiveSuccesses).toBe(1);
      expect(metrics.consecutiveFailures).toBe(0);
      expect(metrics.currentStreak).toBe(1);
      expect(metrics.longestStreak).toBe(1);
      expect(metrics.averageResponseTimeMs).toBe(1000);
      expect(metrics.lastAttemptSuccess).toBe(true);

      // Record second successful attempt
      metrics = metrics.recordAttempt(true, 2000);
      expect(metrics.totalReviews).toBe(2);
      expect(metrics.consecutiveSuccesses).toBe(2);
      expect(metrics.currentStreak).toBe(2);
      expect(metrics.longestStreak).toBe(2);
      expect(metrics.averageResponseTimeMs).toBe(1500);

      // Record a failure
      metrics = metrics.recordAttempt(false, 3000);
      expect(metrics.totalReviews).toBe(3);
      expect(metrics.consecutiveSuccesses).toBe(0);
      expect(metrics.consecutiveFailures).toBe(1);
      expect(metrics.currentStreak).toBe(0);
      expect(metrics.longestStreak).toBe(2);
      expect(metrics.lastAttemptSuccess).toBe(false);
    });
  });
});
