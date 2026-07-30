import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import {
  RecommendationId,
  RecommendationReasonId,
  RecommendationScoreId,
} from '../identifiers/recommendation-ids.js';
import { PriorityScore } from '../value-objects/priority-score.js';
import { RecommendationConfidence } from '../value-objects/recommendation-confidence.js';
import { RecommendationRank } from '../value-objects/recommendation-rank.js';
import { RecommendationWeight } from '../value-objects/recommendation-weight.js';
import { RecommendationReason } from './recommendation-reason.js';
import { RecommendationScore } from './recommendation-score.js';
import { Recommendation } from './recommendation.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('recommendation domain entities', () => {
  describe('RecommendationReason', () => {
    it('creates RecommendationReason entity', () => {
      const reasonId = RecommendationReasonId.create(uuidService.generate());
      const weight = unwrap(RecommendationWeight.create(1.2));

      const reason = RecommendationReason.create({
        code: 'LOW_MASTERY',
        description: 'Mastery score below 50%',
        id: reasonId,
        weight,
      });

      expect(reason.id.equals(reasonId)).toBe(true);
      expect(reason.code).toBe('LOW_MASTERY');
      expect(reason.description).toBe('Mastery score below 50%');
      expect(reason.weight.value).toBe(1.2);
    });
  });

  describe('RecommendationScore', () => {
    it('creates RecommendationScore and calculates composite score', () => {
      const scoreId = RecommendationScoreId.create(uuidService.generate());
      const priority = unwrap(PriorityScore.create(0.8));
      const confidence = unwrap(RecommendationConfidence.create(0.9));
      const weight = unwrap(RecommendationWeight.create(1.0));

      const score = RecommendationScore.create({
        confidence,
        id: scoreId,
        priority,
        weight,
      });

      expect(score.id.equals(scoreId)).toBe(true);
      // 0.8 * 0.9 * 1.0 = 0.72
      expect(score.compositeScore).toBe(0.72);
    });
  });

  describe('Recommendation', () => {
    it('creates recommendation and transitions status cleanly', () => {
      const recId = RecommendationId.create(uuidService.generate());
      const reason = RecommendationReason.create({
        code: 'TEST',
        description: 'Test reason',
        id: RecommendationReasonId.create(uuidService.generate()),
        weight: RecommendationWeight.default(),
      });
      const score = RecommendationScore.create({
        confidence: RecommendationConfidence.default(),
        id: RecommendationScoreId.create(uuidService.generate()),
        priority: unwrap(PriorityScore.create(0.8)),
        weight: RecommendationWeight.default(),
      });

      const rec = Recommendation.create({
        id: recId,
        itemId: 'ex-101',
        itemType: 'exercise',
        rank: RecommendationRank.top(),
        reason,
        score,
      });

      expect(rec.status).toBe('pending');
      expect(rec.selectedAt).toBeNull();
      expect(rec.consumedAt).toBeNull();

      const selectRes = rec.select();
      expect(selectRes.isSuccess).toBe(true);
      expect(rec.status).toBe('selected');
      expect(rec.selectedAt).not.toBeNull();

      const consumeRes = rec.consume();
      expect(consumeRes.isSuccess).toBe(true);
      expect(rec.status).toBe('consumed');
      expect(rec.consumedAt).not.toBeNull();

      // Cannot consume again
      const reConsumeRes = rec.consume();
      expect(reConsumeRes.isSuccess).toBe(false);
      if (!reConsumeRes.isSuccess) {
        expect(reConsumeRes.error.code).toBe('recommendation.already-consumed');
      }
    });
  });
});
