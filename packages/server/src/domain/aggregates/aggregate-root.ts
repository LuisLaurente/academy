import { Entity } from '../entities/entity.js';
import type { DomainEvent } from '../events/domain-event.js';
import type { EntityId } from '../identity/entity-id.js';

export abstract class AggregateRoot<TIdentity extends EntityId<string>> extends Entity<TIdentity> {
  private readonly recordedDomainEvents: DomainEvent<TIdentity>[] = [];

  get pendingDomainEvents(): readonly DomainEvent<TIdentity>[] {
    return Object.freeze([...this.recordedDomainEvents]);
  }

  clearDomainEvents(): void {
    this.recordedDomainEvents.length = 0;
  }

  protected recordDomainEvent<TEventName extends string>(
    event: DomainEvent<TIdentity, TEventName>,
  ): void {
    if (!event.aggregateId.equals(this.id)) {
      throw new TypeError('A domain event must belong to the aggregate that records it.');
    }

    this.recordedDomainEvents.push(event);
  }
}
