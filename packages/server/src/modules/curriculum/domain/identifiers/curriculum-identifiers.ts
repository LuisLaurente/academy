import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class TopicId extends EntityId<'Topic'> {
  static create(value: Uuid): TopicId {
    return new TopicId(value);
  }
}

export class LevelId extends EntityId<'Level'> {
  static create(value: Uuid): LevelId {
    return new LevelId(value);
  }
}

export class SublevelId extends EntityId<'Sublevel'> {
  static create(value: Uuid): SublevelId {
    return new SublevelId(value);
  }
}

export class LessonId extends EntityId<'Lesson'> {
  static create(value: Uuid): LessonId {
    return new LessonId(value);
  }
}

export class ConceptId extends EntityId<'Concept'> {
  static create(value: Uuid): ConceptId {
    return new ConceptId(value);
  }
}
