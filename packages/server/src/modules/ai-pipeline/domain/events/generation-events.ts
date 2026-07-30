import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventData,
  type DomainEventMetadata,
} from '../../../../domain/events/domain-event.js';
import type { RejectedReason } from '../types/ai-pipeline-types.js';
import type { GenerationId } from '../value-objects/ai-pipeline-value-objects.js';

interface GenerationEventEnvelope {
  readonly aggregateId: GenerationId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

abstract class GenerationEvent<TName extends string> extends DomainEvent<GenerationId, TName> {
  protected constructor(
    name: TName,
    envelope: GenerationEventEnvelope,
    payload: DomainEventData = {},
  ) {
    super({
      ...envelope,
      aggregateType: 'AIGenerationRequest',
      eventName: name,
      eventVersion: 1,
      payload,
    });
  }
}

export class GenerationRequested extends GenerationEvent<'GenerationRequested'> {
  constructor(envelope: GenerationEventEnvelope, templateKey: string) {
    super('GenerationRequested', envelope, { templateKey });
  }
}
export class GenerationValidated extends GenerationEvent<'GenerationValidated'> {
  constructor(envelope: GenerationEventEnvelope) {
    super('GenerationValidated', envelope);
  }
}
export class GenerationApproved extends GenerationEvent<'GenerationApproved'> {
  constructor(envelope: GenerationEventEnvelope) {
    super('GenerationApproved', envelope);
  }
}
export class GenerationRejected extends GenerationEvent<'GenerationRejected'> {
  constructor(envelope: GenerationEventEnvelope, reason: RejectedReason) {
    super('GenerationRejected', envelope, { reason });
  }
}
export class GenerationPublished extends GenerationEvent<'GenerationPublished'> {
  constructor(envelope: GenerationEventEnvelope) {
    super('GenerationPublished', envelope);
  }
}
