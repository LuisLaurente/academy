import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { DomainEvent, type DomainEventMetadata } from '../../../../domain/events/domain-event.js';
import type { LearningRecordId, StudentId } from '../identifiers/learning-ids.js';

export interface LearningEventEnvelope {
  readonly aggregateId: LearningRecordId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

export interface LearningRecordCreatedPayload {
  readonly studentId: string;
}

export class LearningRecordCreated extends DomainEvent<LearningRecordId, 'LearningRecordCreated'> {
  constructor(options: LearningEventEnvelope & { readonly studentId: StudentId }) {
    const { studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningRecord',
      eventName: 'LearningRecordCreated',
      eventVersion: 1,
      payload: { studentId: studentId.toString() },
    });
  }
}

export interface LearningProgressUpdatedPayload {
  readonly attempts: number;
  readonly confidence: number;
  readonly mastery: number;
  readonly retention: number;
  readonly score: number;
  readonly studentId: string;
  readonly success: boolean;
}

export class LearningProgressUpdated extends DomainEvent<
  LearningRecordId,
  'LearningProgressUpdated'
> {
  constructor(
    options: LearningEventEnvelope & {
      readonly attempts: number;
      readonly confidence: number;
      readonly mastery: number;
      readonly retention: number;
      readonly score: number;
      readonly studentId: StudentId;
      readonly success: boolean;
    },
  ) {
    const { attempts, confidence, mastery, retention, score, studentId, success, ...envelope } =
      options;
    super({
      ...envelope,
      aggregateType: 'LearningRecord',
      eventName: 'LearningProgressUpdated',
      eventVersion: 1,
      payload: {
        attempts,
        confidence,
        mastery,
        retention,
        score,
        studentId: studentId.toString(),
        success,
      },
    });
  }
}

export interface ReviewScheduledPayload {
  readonly intervalDays: number;
  readonly nextReviewAt: string;
  readonly studentId: string;
}

export class ReviewScheduled extends DomainEvent<LearningRecordId, 'ReviewScheduled'> {
  constructor(
    options: LearningEventEnvelope & {
      readonly intervalDays: number;
      readonly nextReviewAt: Date;
      readonly studentId: StudentId;
    },
  ) {
    const { intervalDays, nextReviewAt, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningRecord',
      eventName: 'ReviewScheduled',
      eventVersion: 1,
      payload: {
        intervalDays,
        nextReviewAt: nextReviewAt.toISOString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export interface MasteryReachedPayload {
  readonly masteryScore: number;
  readonly studentId: string;
}

export class MasteryReached extends DomainEvent<LearningRecordId, 'MasteryReached'> {
  constructor(
    options: LearningEventEnvelope & {
      readonly masteryScore: number;
      readonly studentId: StudentId;
    },
  ) {
    const { masteryScore, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningRecord',
      eventName: 'MasteryReached',
      eventVersion: 1,
      payload: {
        masteryScore,
        studentId: studentId.toString(),
      },
    });
  }
}
