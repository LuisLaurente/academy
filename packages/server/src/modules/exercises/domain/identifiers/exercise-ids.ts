import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class ExerciseId extends EntityId<'Exercise'> {
  static create(value: Uuid): ExerciseId {
    return new ExerciseId(value);
  }
}
