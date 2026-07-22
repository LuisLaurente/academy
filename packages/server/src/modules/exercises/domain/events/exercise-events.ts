import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventData,
  type DomainEventMetadata,
} from '../../../../domain/events/domain-event.js';
import type {
  ExerciseId,
  ExerciseSetId,
  HintId,
  SolutionId,
} from '../identifiers/exercise-identifiers.js';

export interface ExerciseEventEnvelope {
  readonly aggregateId: ExerciseSetId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}
abstract class ExerciseSetEvent<TName extends string> extends DomainEvent<ExerciseSetId, TName> {
  protected constructor(
    name: TName,
    envelope: ExerciseEventEnvelope,
    payload: DomainEventData = {},
  ) {
    super({ ...envelope, aggregateType: 'ExerciseSet', eventName: name, eventVersion: 1, payload });
  }
}
export class ExerciseSetCreated extends ExerciseSetEvent<'ExerciseSetCreated'> {
  constructor(envelope: ExerciseEventEnvelope, lessonId: string) {
    super('ExerciseSetCreated', envelope, { lessonId });
  }
}
export class ExerciseAdded extends ExerciseSetEvent<'ExerciseAdded'> {
  constructor(envelope: ExerciseEventEnvelope, exerciseId: ExerciseId, order: number) {
    super('ExerciseAdded', envelope, { exerciseId: exerciseId.toString(), order });
  }
}
export class HintAdded extends ExerciseSetEvent<'HintAdded'> {
  constructor(envelope: ExerciseEventEnvelope, exerciseId: ExerciseId, hintId: HintId) {
    super('HintAdded', envelope, { exerciseId: exerciseId.toString(), hintId: hintId.toString() });
  }
}
export class SolutionAdded extends ExerciseSetEvent<'SolutionAdded'> {
  constructor(envelope: ExerciseEventEnvelope, exerciseId: ExerciseId, solutionId: SolutionId) {
    super('SolutionAdded', envelope, {
      exerciseId: exerciseId.toString(),
      solutionId: solutionId.toString(),
    });
  }
}
export class ExerciseSetPublished extends ExerciseSetEvent<'ExerciseSetPublished'> {
  constructor(envelope: ExerciseEventEnvelope, lessonId: string) {
    super('ExerciseSetPublished', envelope, { lessonId });
  }
}
