import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventData,
  type DomainEventMetadata,
} from '../../../../domain/events/domain-event.js';
import type {
  ConceptId,
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from '../identifiers/curriculum-identifiers.js';

interface CurriculumEventEnvelope {
  readonly aggregateId: TopicId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

abstract class CurriculumEvent<TEventName extends string> extends DomainEvent<TopicId, TEventName> {
  protected constructor(
    eventName: TEventName,
    envelope: CurriculumEventEnvelope,
    payload: DomainEventData = {},
  ) {
    super({
      ...envelope,
      aggregateType: 'Topic',
      eventName,
      eventVersion: 1,
      payload,
    });
  }
}

export class TopicCreated extends CurriculumEvent<'TopicCreated'> {
  constructor(envelope: CurriculumEventEnvelope) {
    super('TopicCreated', envelope);
  }
}

export class LevelAdded extends CurriculumEvent<'LevelAdded'> {
  constructor(envelope: CurriculumEventEnvelope, levelId: LevelId) {
    super('LevelAdded', envelope, { levelId: levelId.toString() });
  }
}

export class SublevelAdded extends CurriculumEvent<'SublevelAdded'> {
  constructor(envelope: CurriculumEventEnvelope, levelId: LevelId, sublevelId: SublevelId) {
    super('SublevelAdded', envelope, {
      levelId: levelId.toString(),
      sublevelId: sublevelId.toString(),
    });
  }
}

export class LessonAdded extends CurriculumEvent<'LessonAdded'> {
  constructor(
    envelope: CurriculumEventEnvelope,
    levelId: LevelId,
    sublevelId: SublevelId,
    lessonId: LessonId,
  ) {
    super('LessonAdded', envelope, {
      lessonId: lessonId.toString(),
      levelId: levelId.toString(),
      sublevelId: sublevelId.toString(),
    });
  }
}

export class ConceptAdded extends CurriculumEvent<'ConceptAdded'> {
  constructor(envelope: CurriculumEventEnvelope, lessonId: LessonId, conceptId: ConceptId) {
    super('ConceptAdded', envelope, {
      conceptId: conceptId.toString(),
      lessonId: lessonId.toString(),
    });
  }
}
