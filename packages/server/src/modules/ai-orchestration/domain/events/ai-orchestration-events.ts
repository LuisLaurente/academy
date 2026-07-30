import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { DomainEvent, type DomainEventMetadata } from '../../../../domain/events/domain-event.js';
import type { AIRequestId, GenerationJobId } from '../identifiers/ai-orchestration-ids.js';

export interface GenerationEventEnvelope {
  readonly aggregateId: AIRequestId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

export class GenerationRequested extends DomainEvent<AIRequestId, 'GenerationRequested'> {
  constructor(
    options: GenerationEventEnvelope & {
      readonly contentId?: string | null;
      readonly curriculumItemId?: string | null;
      readonly priority: string;
      readonly requestType: string;
    },
  ) {
    const { contentId, curriculumItemId, priority, requestType, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'GenerationRequest',
      eventName: 'GenerationRequested',
      eventVersion: 1,
      payload: {
        contentId: contentId ?? null,
        curriculumItemId: curriculumItemId ?? null,
        priority,
        requestType,
      },
    });
  }
}

export class GenerationStarted extends DomainEvent<AIRequestId, 'GenerationStarted'> {
  constructor(
    options: GenerationEventEnvelope & {
      readonly attemptNumber: number;
      readonly jobId: GenerationJobId;
      readonly startedAt: Date;
    },
  ) {
    const { attemptNumber, jobId, startedAt, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'GenerationRequest',
      eventName: 'GenerationStarted',
      eventVersion: 1,
      payload: {
        attemptNumber,
        jobId: jobId.toString(),
        startedAt: startedAt.toISOString(),
      },
    });
  }
}

export class GenerationCompleted extends DomainEvent<AIRequestId, 'GenerationCompleted'> {
  constructor(
    options: GenerationEventEnvelope & {
      readonly artifactId: string;
      readonly durationMs: number;
      readonly finishedAt: Date;
      readonly tokensUsed: number;
    },
  ) {
    const { artifactId, durationMs, finishedAt, tokensUsed, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'GenerationRequest',
      eventName: 'GenerationCompleted',
      eventVersion: 1,
      payload: {
        artifactId,
        durationMs,
        finishedAt: finishedAt.toISOString(),
        tokensUsed,
      },
    });
  }
}

export class GenerationFailed extends DomainEvent<AIRequestId, 'GenerationFailed'> {
  constructor(
    options: GenerationEventEnvelope & {
      readonly attemptNumber: number;
      readonly canRetry: boolean;
      readonly failedAt: Date;
      readonly reason: string;
    },
  ) {
    const { attemptNumber, canRetry, failedAt, reason, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'GenerationRequest',
      eventName: 'GenerationFailed',
      eventVersion: 1,
      payload: {
        attemptNumber,
        canRetry,
        failedAt: failedAt.toISOString(),
        reason,
      },
    });
  }
}
