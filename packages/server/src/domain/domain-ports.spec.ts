import { describe, expect, it } from 'vitest';

import { CryptoUuidService, type Uuid } from '../core/identifiers/uuid-service.js';
import { AggregateRoot } from './aggregates/aggregate-root.js';
import { DomainEvent } from './events/domain-event.js';
import type { EventBus } from './events/event-bus.js';
import { EntityId } from './identity/entity-id.js';
import type { Repository } from './repositories/repository.js';
import { DomainService } from './services/domain-service.js';
import type { UnitOfWork } from './transactions/unit-of-work.js';

const uuidService = new CryptoUuidService();

class PortTestId extends EntityId<'PortTest'> {
  static create(value: Uuid): PortTestId {
    return new PortTestId(value);
  }
}

class PortTestAggregate extends AggregateRoot<PortTestId> {
  constructor(id: PortTestId) {
    super(id);
  }
}

class RecordingEventBus implements EventBus {
  readonly published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  async publishMany(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}

class RecordingRepository implements Repository<PortTestAggregate, PortTestId> {
  readonly saved: PortTestAggregate[] = [];

  async save(aggregate: PortTestAggregate): Promise<void> {
    this.saved.push(aggregate);
  }
}

class ImmediateUnitOfWork implements UnitOfWork {
  async execute<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    return work();
  }
}

class TestPolicy extends DomainService {
  accepts(candidate: number): boolean {
    return candidate > 0;
  }
}

describe('domain ports', () => {
  it('keeps transaction, persistence and event publication explicitly orchestrated', async () => {
    const aggregate = new PortTestAggregate(PortTestId.create(uuidService.generate()));
    const repository = new RecordingRepository();
    const eventBus = new RecordingEventBus();
    const unitOfWork = new ImmediateUnitOfWork();
    const event = new DomainEvent({
      aggregateId: aggregate.id,
      aggregateType: 'PortTestAggregate',
      aggregateVersion: 1,
      eventId: uuidService.generate(),
      eventName: 'PortTestPersisted',
      eventVersion: 1,
      occurredAt: new Date('2026-07-21T15:00:00.000Z'),
    });

    await unitOfWork.execute(async () => repository.save(aggregate));
    expect(eventBus.published).toEqual([]);

    await eventBus.publish(event);
    await eventBus.publishMany([event]);

    expect(repository.saved).toEqual([aggregate]);
    expect(eventBus.published).toEqual([event, event]);
  });

  it('allows stateless domain policies without framework dependencies', () => {
    const policy = new TestPolicy();

    expect(policy.accepts(1)).toBe(true);
    expect(policy.accepts(0)).toBe(false);
  });
});
