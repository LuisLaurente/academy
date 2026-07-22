import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { LearningRecordId, StudentId } from '../identifiers/learning-ids.js';
import {
  LearningProgressUpdated,
  LearningRecordCreated,
  MasteryReached,
  ReviewScheduled,
} from './learning-events.js';

const uuidService = new CryptoUuidService();

describe('learning domain events', () => {
  const recordId = LearningRecordId.create(uuidService.generate());
  const studentId = StudentId.create(uuidService.generate());
  const occurredAt = new Date('2026-07-21T20:00:00.000Z');
  const envelope = {
    aggregateId: recordId,
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt,
  } as const;

  it('creates LearningRecordCreated event', () => {
    const event = new LearningRecordCreated({
      ...envelope,
      studentId,
    });

    expect(event.eventName).toBe('LearningRecordCreated');
    expect(event.aggregateType).toBe('LearningRecord');
    expect(event.eventVersion).toBe(1);
    expect(event.payload).toEqual({ studentId: studentId.toString() });
  });

  it('creates LearningProgressUpdated event', () => {
    const event = new LearningProgressUpdated({
      ...envelope,
      attempts: 5,
      confidence: 0.8,
      mastery: 0.9,
      retention: 0.95,
      score: 1.0,
      studentId,
      success: true,
    });

    expect(event.eventName).toBe('LearningProgressUpdated');
    expect(event.payload).toEqual({
      attempts: 5,
      confidence: 0.8,
      mastery: 0.9,
      retention: 0.95,
      score: 1.0,
      studentId: studentId.toString(),
      success: true,
    });
  });

  it('creates ReviewScheduled event', () => {
    const nextReviewAt = new Date('2026-07-28T20:00:00.000Z');
    const event = new ReviewScheduled({
      ...envelope,
      intervalDays: 7,
      nextReviewAt,
      studentId,
    });

    expect(event.eventName).toBe('ReviewScheduled');
    expect(event.payload).toEqual({
      intervalDays: 7,
      nextReviewAt: nextReviewAt.toISOString(),
      studentId: studentId.toString(),
    });
  });

  it('creates MasteryReached event', () => {
    const event = new MasteryReached({
      ...envelope,
      masteryScore: 0.9,
      studentId,
    });

    expect(event.eventName).toBe('MasteryReached');
    expect(event.payload).toEqual({
      masteryScore: 0.9,
      studentId: studentId.toString(),
    });
  });
});
