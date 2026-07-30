import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { SessionId, SessionItemId } from '../identifiers/session-ids.js';
import {
  SessionFinished,
  SessionItemCompleted,
  SessionItemSkipped,
  SessionStarted,
} from './session-events.js';

const uuidService = new CryptoUuidService();

describe('session domain events', () => {
  const sessionId = SessionId.create(uuidService.generate());
  const studentId = StudentId.create(uuidService.generate());
  const itemId = SessionItemId.create(uuidService.generate());
  const occurredAt = new Date('2026-07-22T00:00:00.000Z');
  const envelope = {
    aggregateId: sessionId,
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt,
  } as const;

  it('creates SessionStarted event', () => {
    const event = new SessionStarted({
      ...envelope,
      startedAt: occurredAt,
      studentId,
      totalExercises: 5,
    });

    expect(event.eventName).toBe('SessionStarted');
    expect(event.aggregateType).toBe('LearningSession');
    expect(event.payload).toEqual({
      startedAt: occurredAt.toISOString(),
      studentId: studentId.toString(),
      totalExercises: 5,
    });
  });

  it('creates SessionItemCompleted event', () => {
    const event = new SessionItemCompleted({
      ...envelope,
      completedAt: occurredAt,
      itemId: 'ex-101',
      itemType: 'exercise',
      score: 0.9,
      sessionItemId: itemId,
      studentId,
    });

    expect(event.eventName).toBe('SessionItemCompleted');
    expect(event.payload).toEqual({
      completedAt: occurredAt.toISOString(),
      itemId: 'ex-101',
      itemType: 'exercise',
      score: 0.9,
      sessionItemId: itemId.toString(),
      studentId: studentId.toString(),
    });
  });

  it('creates SessionItemSkipped event', () => {
    const event = new SessionItemSkipped({
      ...envelope,
      itemId: 'ex-102',
      itemType: 'exercise',
      sessionItemId: itemId,
      skippedAt: occurredAt,
      studentId,
    });

    expect(event.eventName).toBe('SessionItemSkipped');
    expect(event.payload).toEqual({
      itemId: 'ex-102',
      itemType: 'exercise',
      sessionItemId: itemId.toString(),
      skippedAt: occurredAt.toISOString(),
      studentId: studentId.toString(),
    });
  });

  it('creates SessionFinished event', () => {
    const finishedAt = new Date('2026-07-22T00:20:00.000Z');
    const event = new SessionFinished({
      ...envelope,
      completedExercises: 4,
      completionRate: 0.8,
      finishedAt,
      skippedExercises: 1,
      startedAt: occurredAt,
      studentId,
      totalExercises: 5,
    });

    expect(event.eventName).toBe('SessionFinished');
    expect(event.payload).toEqual({
      completedExercises: 4,
      completionRate: 0.8,
      finishedAt: finishedAt.toISOString(),
      skippedExercises: 1,
      startedAt: occurredAt.toISOString(),
      studentId: studentId.toString(),
      totalExercises: 5,
    });
  });
});
