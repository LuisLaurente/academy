import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class ContentId extends EntityId<'LessonContent'> {
  static create(value: Uuid): ContentId {
    return new ContentId(value);
  }
}

export class TheoryId extends EntityId<'Theory'> {
  static create(value: Uuid): TheoryId {
    return new TheoryId(value);
  }
}

export class ExampleId extends EntityId<'Example'> {
  static create(value: Uuid): ExampleId {
    return new ExampleId(value);
  }
}

export class SummaryId extends EntityId<'Summary'> {
  static create(value: Uuid): SummaryId {
    return new SummaryId(value);
  }
}
