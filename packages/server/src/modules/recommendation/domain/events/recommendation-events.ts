import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { DomainEvent, type DomainEventMetadata } from '../../../../domain/events/domain-event.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationId, RecommendationSetId } from '../identifiers/recommendation-ids.js';

export interface RecommendationEventEnvelope {
  readonly aggregateId: RecommendationSetId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

export class RecommendationsGenerated extends DomainEvent<
  RecommendationSetId,
  'RecommendationsGenerated'
> {
  constructor(
    options: RecommendationEventEnvelope & {
      readonly count: number;
      readonly expiresAt: Date;
      readonly generationReason: string;
      readonly studentId: StudentId;
    },
  ) {
    const { count, expiresAt, generationReason, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'RecommendationSet',
      eventName: 'RecommendationsGenerated',
      eventVersion: 1,
      payload: {
        count,
        expiresAt: expiresAt.toISOString(),
        generationReason,
        studentId: studentId.toString(),
      },
    });
  }
}

export class RecommendationSelected extends DomainEvent<
  RecommendationSetId,
  'RecommendationSelected'
> {
  constructor(
    options: RecommendationEventEnvelope & {
      readonly itemId: string;
      readonly itemType: string;
      readonly recommendationId: RecommendationId;
      readonly studentId: StudentId;
    },
  ) {
    const { itemId, itemType, recommendationId, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'RecommendationSet',
      eventName: 'RecommendationSelected',
      eventVersion: 1,
      payload: {
        itemId,
        itemType,
        recommendationId: recommendationId.toString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export class RecommendationConsumed extends DomainEvent<
  RecommendationSetId,
  'RecommendationConsumed'
> {
  constructor(
    options: RecommendationEventEnvelope & {
      readonly consumedAt: Date;
      readonly itemId: string;
      readonly itemType: string;
      readonly recommendationId: RecommendationId;
      readonly studentId: StudentId;
    },
  ) {
    const { consumedAt, itemId, itemType, recommendationId, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'RecommendationSet',
      eventName: 'RecommendationConsumed',
      eventVersion: 1,
      payload: {
        consumedAt: consumedAt.toISOString(),
        itemId,
        itemType,
        recommendationId: recommendationId.toString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export class RecommendationsExpired extends DomainEvent<
  RecommendationSetId,
  'RecommendationsExpired'
> {
  constructor(
    options: RecommendationEventEnvelope & {
      readonly expiredCount: number;
      readonly studentId: StudentId;
    },
  ) {
    const { expiredCount, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'RecommendationSet',
      eventName: 'RecommendationsExpired',
      eventVersion: 1,
      payload: {
        expiredCount,
        studentId: studentId.toString(),
      },
    });
  }
}
