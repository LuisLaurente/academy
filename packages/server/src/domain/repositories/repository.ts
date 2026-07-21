import type { AggregateRoot } from '../aggregates/aggregate-root.js';
import type { EntityId } from '../identity/entity-id.js';

export interface Repository<
  TAggregate extends AggregateRoot<TIdentity>,
  TIdentity extends EntityId<string>,
> {
  save(aggregate: TAggregate): Promise<void>;
}
