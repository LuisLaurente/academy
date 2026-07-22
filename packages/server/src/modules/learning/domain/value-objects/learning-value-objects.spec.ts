import { describe, expect, it } from 'vitest';
import { AttemptCount } from './attempt-count.js';
import { ConfidenceScore } from './confidence-score.js';
import { MasteryScore } from './mastery-score.js';
import { RetentionScore } from './retention-score.js';
import { ReviewInterval } from './review-interval.js';
import { SuccessRate } from './success-rate.js';

describe('learning value objects', () => {
  describe('MasteryScore', () => {
    it('creates valid MasteryScore and checks limits', () => {
      const res = MasteryScore.create(0.85);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.85);
        expect(res.value.isMastered()).toBe(true);
        expect(res.value.isMastered(0.9)).toBe(false);
        expect(res.value.toString()).toBe('0.85');
      }

      expect(MasteryScore.zero().value).toBe(0);
      expect(MasteryScore.max().value).toBe(1);
    });

    it('rejects invalid MasteryScore values', () => {
      expect(MasteryScore.create(-0.1).isSuccess).toBe(false);
      expect(MasteryScore.create(1.1).isSuccess).toBe(false);
      expect(MasteryScore.create(NaN).isSuccess).toBe(false);
    });

    it('tests equality', () => {
      const m1 = MasteryScore.create(0.75);
      const m2 = MasteryScore.create(0.75);
      const m3 = MasteryScore.create(0.8);

      if (m1.isSuccess && m2.isSuccess && m3.isSuccess) {
        expect(m1.value.equals(m2.value)).toBe(true);
        expect(m1.value.equals(m3.value)).toBe(false);
      }
    });
  });

  describe('ConfidenceScore', () => {
    it('creates valid ConfidenceScore', () => {
      const res = ConfidenceScore.create(0.6);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.6);
      }

      expect(ConfidenceScore.zero().value).toBe(0);
      expect(ConfidenceScore.default().value).toBe(0.5);
      expect(ConfidenceScore.max().value).toBe(1);
    });

    it('rejects invalid ConfidenceScore', () => {
      expect(ConfidenceScore.create(-1).isSuccess).toBe(false);
      expect(ConfidenceScore.create(2).isSuccess).toBe(false);
    });
  });

  describe('RetentionScore', () => {
    it('creates valid RetentionScore', () => {
      const res = RetentionScore.create(0.9);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.9);
      }

      expect(RetentionScore.zero().value).toBe(0);
      expect(RetentionScore.max().value).toBe(1);
    });

    it('rejects invalid RetentionScore', () => {
      expect(RetentionScore.create(-0.01).isSuccess).toBe(false);
    });
  });

  describe('ReviewInterval', () => {
    it('creates and converts ReviewInterval', () => {
      const res = ReviewInterval.create(2.5);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.inDays).toBe(2.5);
        expect(res.value.inHours).toBe(60);
        expect(res.value.inMilliseconds).toBe(2.5 * 24 * 3600 * 1000);
        expect(res.value.toString()).toBe('2.5 days');
      }

      const fromHoursRes = ReviewInterval.fromHours(12);
      expect(fromHoursRes.isSuccess).toBe(true);
      if (fromHoursRes.isSuccess) {
        expect(fromHoursRes.value.inDays).toBe(0.5);
      }

      expect(ReviewInterval.zero().inDays).toBe(0);
    });

    it('rejects negative ReviewInterval', () => {
      expect(ReviewInterval.create(-1).isSuccess).toBe(false);
    });
  });

  describe('SuccessRate', () => {
    it('creates valid SuccessRate and computes from attempts', () => {
      const res = SuccessRate.create(0.75);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.value).toBe(0.75);
        expect(res.value.percentage).toBe(75);
        expect(res.value.toString()).toBe('75%');
      }

      const rateFromAttempts = SuccessRate.fromAttempts(3, 4);
      expect(rateFromAttempts.value).toBe(0.75);

      const zeroRate = SuccessRate.fromAttempts(0, 0);
      expect(zeroRate.value).toBe(0);
    });

    it('rejects invalid SuccessRate', () => {
      expect(SuccessRate.create(1.5).isSuccess).toBe(false);
    });
  });

  describe('AttemptCount', () => {
    it('creates valid AttemptCount and performs arithmetic', () => {
      const res = AttemptCount.create(5);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        const inc = res.value.increment();
        expect(inc.value).toBe(6);

        const added = inc.add(4);
        expect(added.isSuccess).toBe(true);
        if (added.isSuccess) {
          expect(added.value.value).toBe(10);
        }
      }

      expect(AttemptCount.zero().value).toBe(0);
    });

    it('rejects non-integer or negative AttemptCount', () => {
      expect(AttemptCount.create(-1).isSuccess).toBe(false);
      expect(AttemptCount.create(3.14).isSuccess).toBe(false);
    });
  });
});
