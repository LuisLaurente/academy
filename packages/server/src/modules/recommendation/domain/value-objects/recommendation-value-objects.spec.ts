import { describe, expect, it } from 'vitest';
import { ExpirationTime } from './expiration-time.js';
import { PriorityScore } from './priority-score.js';
import { RecommendationConfidence } from './recommendation-confidence.js';
import { RecommendationRank } from './recommendation-rank.js';
import { RecommendationWeight } from './recommendation-weight.js';

describe('recommendation value objects', () => {
  describe('PriorityScore', () => {
    it('creates valid PriorityScore and tests limits', () => {
      const res = PriorityScore.create(0.8);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.8);
        expect(res.value.toString()).toBe('0.8');
      }

      expect(PriorityScore.min().value).toBe(0);
      expect(PriorityScore.max().value).toBe(1);
    });

    it('rejects invalid PriorityScore values', () => {
      expect(PriorityScore.create(-0.1).isSuccess).toBe(false);
      expect(PriorityScore.create(1.2).isSuccess).toBe(false);
    });
  });

  describe('RecommendationConfidence', () => {
    it('creates valid RecommendationConfidence', () => {
      const res = RecommendationConfidence.create(0.75);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.75);
      }

      expect(RecommendationConfidence.default().value).toBe(0.5);
      expect(RecommendationConfidence.max().value).toBe(1.0);
    });

    it('rejects invalid RecommendationConfidence', () => {
      expect(RecommendationConfidence.create(-0.5).isSuccess).toBe(false);
    });
  });

  describe('RecommendationWeight', () => {
    it('creates valid RecommendationWeight', () => {
      const res = RecommendationWeight.create(1.5);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(1.5);
      }

      expect(RecommendationWeight.default().value).toBe(1.0);
    });

    it('rejects negative RecommendationWeight', () => {
      expect(RecommendationWeight.create(-1).isSuccess).toBe(false);
    });
  });

  describe('ExpirationTime', () => {
    it('creates valid ExpirationTime and checks expiry', () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      const pastDate = new Date(Date.now() - 3600 * 1000);

      const expFuture = ExpirationTime.create(futureDate);
      expect(expFuture.isSuccess).toBe(true);
      if (expFuture.isSuccess) {
        expect(expFuture.value.isExpired()).toBe(false);
      }

      const expPast = ExpirationTime.create(pastDate);
      expect(expPast.isSuccess).toBe(true);
      if (expPast.isSuccess) {
        expect(expPast.value.isExpired()).toBe(true);
      }

      const fromHoursRes = ExpirationTime.fromHours(24);
      expect(fromHoursRes.isSuccess).toBe(true);
    });

    it('rejects invalid ExpirationTime date or non-finite hours', () => {
      expect(ExpirationTime.create(new Date(NaN)).isSuccess).toBe(false);
      expect(ExpirationTime.fromHours(NaN).isSuccess).toBe(false);
    });
  });

  describe('RecommendationRank', () => {
    it('creates valid RecommendationRank', () => {
      const res = RecommendationRank.create(1);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(1);
        expect(res.value.toString()).toBe('#1');
      }

      expect(RecommendationRank.top().value).toBe(1);
    });

    it('rejects non-positive or non-integer rank', () => {
      expect(RecommendationRank.create(0).isSuccess).toBe(false);
      expect(RecommendationRank.create(1.5).isSuccess).toBe(false);
    });
  });
});
