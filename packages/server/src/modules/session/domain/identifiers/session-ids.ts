import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class SessionId extends EntityId<'LearningSession'> {
  static create(value: Uuid): SessionId {
    return new SessionId(value);
  }
}

export class SessionItemId extends EntityId<'SessionItem'> {
  static create(value: Uuid): SessionItemId {
    return new SessionItemId(value);
  }
}

export class SessionStatisticsId extends EntityId<'SessionStatistics'> {
  static create(value: Uuid): SessionStatisticsId {
    return new SessionStatisticsId(value);
  }
}
