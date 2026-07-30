import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { DomainEvent, type DomainEventMetadata } from '../../../../domain/events/domain-event.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionId, SessionItemId } from '../identifiers/session-ids.js';

export interface SessionEventEnvelope {
  readonly aggregateId: SessionId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

export class SessionStarted extends DomainEvent<SessionId, 'SessionStarted'> {
  constructor(
    options: SessionEventEnvelope & {
      readonly startedAt: Date;
      readonly studentId: StudentId;
      readonly totalExercises: number;
    },
  ) {
    const { startedAt, studentId, totalExercises, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningSession',
      eventName: 'SessionStarted',
      eventVersion: 1,
      payload: {
        startedAt: startedAt.toISOString(),
        studentId: studentId.toString(),
        totalExercises,
      },
    });
  }
}

export class SessionItemCompleted extends DomainEvent<SessionId, 'SessionItemCompleted'> {
  constructor(
    options: SessionEventEnvelope & {
      readonly completedAt: Date;
      readonly itemId: string;
      readonly itemType: string;
      readonly score?: number | null | undefined;
      readonly sessionItemId: SessionItemId;
      readonly studentId: StudentId;
    },
  ) {
    const { completedAt, itemId, itemType, score, sessionItemId, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningSession',
      eventName: 'SessionItemCompleted',
      eventVersion: 1,
      payload: {
        completedAt: completedAt.toISOString(),
        itemId,
        itemType,
        score: score ?? null,
        sessionItemId: sessionItemId.toString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export class SessionItemSkipped extends DomainEvent<SessionId, 'SessionItemSkipped'> {
  constructor(
    options: SessionEventEnvelope & {
      readonly itemId: string;
      readonly itemType: string;
      readonly sessionItemId: SessionItemId;
      readonly skippedAt: Date;
      readonly studentId: StudentId;
    },
  ) {
    const { itemId, itemType, sessionItemId, skippedAt, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningSession',
      eventName: 'SessionItemSkipped',
      eventVersion: 1,
      payload: {
        itemId,
        itemType,
        sessionItemId: sessionItemId.toString(),
        skippedAt: skippedAt.toISOString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export class SessionFinished extends DomainEvent<SessionId, 'SessionFinished'> {
  constructor(
    options: SessionEventEnvelope & {
      readonly completedExercises: number;
      readonly completionRate: number;
      readonly finishedAt: Date;
      readonly skippedExercises: number;
      readonly startedAt: Date;
      readonly studentId: StudentId;
      readonly totalExercises: number;
    },
  ) {
    const {
      completedExercises,
      completionRate,
      finishedAt,
      skippedExercises,
      startedAt,
      studentId,
      totalExercises,
      ...envelope
    } = options;

    super({
      ...envelope,
      aggregateType: 'LearningSession',
      eventName: 'SessionFinished',
      eventVersion: 1,
      payload: {
        completedExercises,
        completionRate,
        finishedAt: finishedAt.toISOString(),
        skippedExercises,
        startedAt: startedAt.toISOString(),
        studentId: studentId.toString(),
        totalExercises,
      },
    });
  }
}
