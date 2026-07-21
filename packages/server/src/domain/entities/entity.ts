import type { DomainError } from '../../core/errors/domain-error.js';
import type { EntityId } from '../identity/entity-id.js';

export abstract class Entity<TIdentity extends EntityId<string>> {
  readonly id: TIdentity;

  protected constructor(id: TIdentity) {
    this.id = id;
  }

  equals(other: unknown): boolean {
    return (
      other instanceof Entity && other.constructor === this.constructor && this.id.equals(other.id)
    );
  }

  protected ensureInvariant(
    condition: unknown,
    errorFactory: () => DomainError,
  ): asserts condition {
    if (!condition) {
      throw errorFactory();
    }
  }
}
