import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventData,
  type DomainEventMetadata,
} from '../../../../domain/events/domain-event.js';
import type { EvaluationId, SubmissionId } from '../identifiers/evaluation-identifiers.js';

export interface EvaluationEventEnvelope {
  readonly aggregateId: EvaluationId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}
abstract class EvaluationEvent<TName extends string> extends DomainEvent<EvaluationId, TName> {
  protected constructor(
    name: TName,
    envelope: EvaluationEventEnvelope,
    payload: DomainEventData = {},
  ) {
    super({ ...envelope, aggregateType: 'Evaluation', eventName: name, eventVersion: 1, payload });
  }
}
export class EvaluationStarted extends EvaluationEvent<'EvaluationStarted'> {
  constructor(envelope: EvaluationEventEnvelope, submissionId: SubmissionId, exerciseId: string) {
    super('EvaluationStarted', envelope, { exerciseId, submissionId: submissionId.toString() });
  }
}
export class EvaluationCompleted extends EvaluationEvent<'EvaluationCompleted'> {
  constructor(envelope: EvaluationEventEnvelope, passed: boolean, score: number) {
    super('EvaluationCompleted', envelope, { passed, score });
  }
}
export class EvaluationFailed extends EvaluationEvent<'EvaluationFailed'> {
  constructor(envelope: EvaluationEventEnvelope, reason: string) {
    super('EvaluationFailed', envelope, { reason });
  }
}
