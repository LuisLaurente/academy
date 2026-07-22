import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { LearningRecordId, StudentId } from '../identifiers/learning-ids.js';
import { ConfidenceScore } from '../value-objects/confidence-score.js';
import { MasteryScore } from '../value-objects/mastery-score.js';
import { RetentionScore } from '../value-objects/retention-score.js';
import { ReviewInterval } from '../value-objects/review-interval.js';
import { LearningRecord } from './learning-record.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('LearningRecord aggregate root', () => {
  const createTestRecord = () => {
    const id = LearningRecordId.create(uuidService.generate());
    const studentId = StudentId.create(uuidService.generate());
    const record = LearningRecord.create({
      eventId: uuidService.generate(),
      id,
      studentId,
    });
    return { id, record, studentId };
  };

  it('initializes with default pedagogical values and records creation event', () => {
    const { id, record, studentId } = createTestRecord();

    expect(record.id.equals(id)).toBe(true);
    expect(record.studentId.equals(studentId)).toBe(true);
    expect(record.mastery.value).toBe(0);
    expect(record.confidence.value).toBe(0.5);
    expect(record.retention.value).toBe(1.0);
    expect(record.attempts.value).toBe(0);
    expect(record.successes.value).toBe(0);
    expect(record.failures.value).toBe(0);
    expect(record.lastReviewedAt).toBeNull();
    expect(record.nextReviewAt).toBeNull();
    expect(record.locked).toBe(false);
    expect(record.pendingDomainEvents.length).toBe(1);
    expect(record.pendingDomainEvents[0]?.eventName).toBe('LearningRecordCreated');
  });

  it('updates progress successfully and records MasteryReached when threshold met', () => {
    const { record } = createTestRecord();
    record.clearDomainEvents();

    const eventId = uuidService.generate();
    const now = new Date();

    const result = record.updateProgress(
      {
        confidence: unwrap(ConfidenceScore.create(0.9)),
        mastery: unwrap(MasteryScore.create(0.9)),
        retention: unwrap(RetentionScore.create(0.95)),
        reviewedAt: now,
        score: 1.0,
        success: true,
      },
      { eventId, occurredAt: now },
    );

    expect(result.isSuccess).toBe(true);
    expect(record.attempts.value).toBe(1);
    expect(record.successes.value).toBe(1);
    expect(record.failures.value).toBe(0);
    expect(record.mastery.value).toBe(0.9);
    expect(record.lastReviewedAt).toEqual(now);
    expect(record.reviewHistory.length).toBe(1);

    const eventNames = record.pendingDomainEvents.map((e) => e.eventName);
    expect(eventNames).toContain('LearningProgressUpdated');
    expect(eventNames).toContain('MasteryReached');
  });

  it('prevents progress update when locked', () => {
    const { record } = createTestRecord();
    record.lock();

    const result = record.updateProgress(
      { score: 1.0, success: true },
      { eventId: uuidService.generate() },
    );

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('learning.record-locked');
    }
  });

  it('prevents progress update with past timestamp relative to lastReviewedAt', () => {
    const { record } = createTestRecord();
    const t1 = new Date('2026-07-20T12:00:00.000Z');
    const t2 = new Date('2026-07-19T12:00:00.000Z');

    record.updateProgress(
      { score: 1.0, success: true },
      { eventId: uuidService.generate(), occurredAt: t1 },
    );

    const result = record.updateProgress(
      { score: 1.0, success: true },
      { eventId: uuidService.generate(), occurredAt: t2 },
    );

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('learning.invalid-transition');
    }
  });

  it('schedules review successfully', () => {
    const { record } = createTestRecord();
    record.clearDomainEvents();

    const now = new Date('2026-07-21T12:00:00.000Z');
    const nextReviewAt = new Date('2026-07-28T12:00:00.000Z');
    const interval = unwrap(ReviewInterval.fromDays(7));

    const result = record.scheduleReview(
      { interval, nextReviewAt },
      { eventId: uuidService.generate(), occurredAt: now },
    );

    expect(result.isSuccess).toBe(true);
    expect(record.nextReviewAt).toEqual(nextReviewAt);
    expect(record.isReviewDue(new Date('2026-07-27T12:00:00.000Z'))).toBe(false);
    expect(record.isReviewDue(new Date('2026-07-28T12:00:01.000Z'))).toBe(true);
    expect(record.pendingDomainEvents.length).toBe(1);
    expect(record.pendingDomainEvents[0]?.eventName).toBe('ReviewScheduled');
  });

  it('rejects scheduling next review in the past', () => {
    const { record } = createTestRecord();
    const now = new Date('2026-07-21T12:00:00.000Z');
    const nextReviewAt = new Date('2026-07-20T12:00:00.000Z');
    const interval = unwrap(ReviewInterval.fromDays(1));

    const result = record.scheduleReview(
      { interval, nextReviewAt },
      { eventId: uuidService.generate(), occurredAt: now },
    );

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.code).toBe('learning.invalid-transition');
    }
  });

  it('calculates success rate correctly', () => {
    const { record } = createTestRecord();
    const eventId = uuidService.generate();

    record.updateProgress({ score: 1.0, success: true }, { eventId });
    record.updateProgress({ score: 0.0, success: false }, { eventId });
    record.updateProgress({ score: 1.0, success: true }, { eventId });

    const rate = record.calculateSuccessRate();
    expect(rate.value).toBe(0.6667);
  });
});
