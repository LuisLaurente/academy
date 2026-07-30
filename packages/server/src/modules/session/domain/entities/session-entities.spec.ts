import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { SessionItemId, SessionStatisticsId } from '../identifiers/session-ids.js';
import { CompletedCount } from '../value-objects/completed-count.js';
import { CompletionRate } from '../value-objects/completion-rate.js';
import { SessionDuration } from '../value-objects/session-duration.js';
import { SkippedCount } from '../value-objects/skipped-count.js';
import { SessionItem } from './session-item.js';
import { SessionStatistics } from './session-statistics.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('session domain entities', () => {
  describe('SessionItem', () => {
    it('creates SessionItem, activates, completes and rejects re-completion', () => {
      const item = SessionItem.create({
        id: SessionItemId.create(uuidService.generate()),
        itemId: 'ex-101',
        itemType: 'exercise',
        order: 1,
      });

      expect(item.status).toBe('pending');
      expect(item.score).toBeNull();

      item.activate();
      expect(item.status).toBe('active');

      const completeRes = item.complete(0.95);
      expect(completeRes.isSuccess).toBe(true);
      expect(item.status).toBe('completed');
      expect(item.score).toBe(0.95);
      expect(item.completedAt).not.toBeNull();

      const reCompleteRes = item.complete(0.8);
      expect(reCompleteRes.isSuccess).toBe(false);
      if (!reCompleteRes.isSuccess) {
        expect(reCompleteRes.error.code).toBe('session.invalid-transition');
      }
    });

    it('skips SessionItem and rejects skipping completed item', () => {
      const item = SessionItem.create({
        id: SessionItemId.create(uuidService.generate()),
        itemId: 'ex-102',
        itemType: 'exercise',
        order: 2,
      });

      const skipRes = item.skip();
      expect(skipRes.isSuccess).toBe(true);
      expect(item.status).toBe('skipped');
      expect(item.skippedAt).not.toBeNull();

      const reSkipRes = item.skip();
      expect(reSkipRes.isSuccess).toBe(false);
    });
  });

  describe('SessionStatistics', () => {
    it('creates SessionStatistics entity', () => {
      const statsId = SessionStatisticsId.create(uuidService.generate());
      const duration = unwrap(SessionDuration.create(600000));
      const completionRate = CompletionRate.fromCounts(4, 5);
      const completedCount = unwrap(CompletedCount.create(4));
      const skippedCount = unwrap(SkippedCount.create(1));

      const stats = SessionStatistics.create({
        averageScore: 0.88,
        completedCount,
        completionRate,
        duration,
        id: statsId,
        skippedCount,
      });

      expect(stats.id.equals(statsId)).toBe(true);
      expect(stats.duration.inMinutes).toBe(10);
      expect(stats.completionRate.percentage).toBe(80);
      expect(stats.averageScore).toBe(0.88);
    });
  });
});
