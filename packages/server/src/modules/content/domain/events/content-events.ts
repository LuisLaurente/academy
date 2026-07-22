import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventData,
  type DomainEventMetadata,
} from '../../../../domain/events/domain-event.js';
import type {
  ContentId,
  ExampleId,
  SummaryId,
  TheoryId,
} from '../identifiers/content-identifiers.js';

interface ContentEventEnvelope {
  readonly aggregateId: ContentId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

abstract class ContentEvent<TName extends string> extends DomainEvent<ContentId, TName> {
  protected constructor(
    name: TName,
    envelope: ContentEventEnvelope,
    payload: DomainEventData = {},
  ) {
    super({
      ...envelope,
      aggregateType: 'LessonContent',
      eventName: name,
      eventVersion: 1,
      payload,
    });
  }
}

export class LessonContentCreated extends ContentEvent<'LessonContentCreated'> {
  constructor(envelope: ContentEventEnvelope, lessonId: string) {
    super('LessonContentCreated', envelope, { lessonId });
  }
}
export class TheoryUpdated extends ContentEvent<'TheoryUpdated'> {
  constructor(envelope: ContentEventEnvelope, theoryId: TheoryId) {
    super('TheoryUpdated', envelope, { theoryId: theoryId.toString() });
  }
}
export class KeyConceptAdded extends ContentEvent<'KeyConceptAdded'> {
  constructor(envelope: ContentEventEnvelope, name: string, displayOrder: number) {
    super('KeyConceptAdded', envelope, { displayOrder, name });
  }
}
export class ExampleAdded extends ContentEvent<'ExampleAdded'> {
  constructor(envelope: ContentEventEnvelope, exampleId: ExampleId) {
    super('ExampleAdded', envelope, { exampleId: exampleId.toString() });
  }
}
export class SummaryUpdated extends ContentEvent<'SummaryUpdated'> {
  constructor(envelope: ContentEventEnvelope, summaryId: SummaryId) {
    super('SummaryUpdated', envelope, { summaryId: summaryId.toString() });
  }
}
export class LessonContentPublished extends ContentEvent<'LessonContentPublished'> {
  constructor(envelope: ContentEventEnvelope, lessonId: string) {
    super('LessonContentPublished', envelope, { lessonId });
  }
}
