import type { Uuid } from '../../core/identifiers/uuid-service.js';
import { ValueObject } from '../../core/value-objects/value-object.js';

export abstract class EntityId<TIdentityKind extends string> extends ValueObject {
  declare private readonly identityKind: TIdentityKind;

  readonly value: Uuid;

  protected constructor(value: Uuid) {
    super();
    this.value = value;
  }

  override toString(): string {
    return this.value;
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.value];
  }
}
