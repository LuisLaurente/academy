import type { Uuid } from '../../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../../domain/identity/entity-id.js';

export class UserId extends EntityId<'User'> {
  static create(value: Uuid): UserId {
    return new UserId(value);
  }
}

export class SessionId extends EntityId<'Session'> {
  static create(value: Uuid): SessionId {
    return new SessionId(value);
  }
}
