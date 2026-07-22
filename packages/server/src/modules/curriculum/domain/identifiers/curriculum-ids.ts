import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class CurriculumItemId extends EntityId<'CurriculumItem'> {
  static create(value: Uuid): CurriculumItemId {
    return new CurriculumItemId(value);
  }
}
