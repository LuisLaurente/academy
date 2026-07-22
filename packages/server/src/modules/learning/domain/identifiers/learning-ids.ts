import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class LearningRecordId extends EntityId<'LearningRecord'> {
  static create(value: Uuid): LearningRecordId {
    return new LearningRecordId(value);
  }
}

export class StudentId extends EntityId<'Student'> {
  static create(value: Uuid): StudentId {
    return new StudentId(value);
  }
}

export class ReviewHistoryId extends EntityId<'ReviewHistory'> {
  static create(value: Uuid): ReviewHistoryId {
    return new ReviewHistoryId(value);
  }
}

export class LearningMetricsId extends EntityId<'LearningMetrics'> {
  static create(value: Uuid): LearningMetricsId {
    return new LearningMetricsId(value);
  }
}
