import { describe, expect, it } from 'vitest';

import { CryptoUuidService, type Uuid } from '../../core/identifiers/uuid-service.js';
import { AggregateRoot } from '../aggregates/aggregate-root.js';
import { EntityId } from '../identity/entity-id.js';
import { DomainEvent } from './domain-event.js';

const uuidService = new CryptoUuidService();

class TestAggregateId extends EntityId<'TestAggregate'> {
  static create(value: Uuid): TestAggregateId {
    return new TestAggregateId(value);
  }
}

class TestAggregate extends AggregateRoot<TestAggregateId> {
  constructor(id: TestAggregateId) {
    super(id);
  }

  record(event: DomainEvent<TestAggregateId>): void {
    this.recordDomainEvent(event);
  }
}

function createEvent(
  aggregateId: TestAggregateId,
  occurredAt = new Date('2026-07-21T15:00:00.000Z'),
): DomainEvent<TestAggregateId, 'TestOccurred'> {
  return new DomainEvent({
    aggregateId,
    aggregateType: 'TestAggregate',
    aggregateVersion: 3,
    eventId: uuidService.generate(),
    eventName: 'TestOccurred',
    eventVersion: 1,
    metadata: {
      correlationId: uuidService.generate(),
      attributes: { source: { channel: 'unit-test' } },
    },
    occurredAt,
    payload: { evidence: { scores: [1, 2] } },
  });
}

describe('DomainEvent', () => {
  it('preserves its required envelope and freezes nested data', () => {
    const aggregateId = TestAggregateId.create(uuidService.generate());
    const event = createEvent(aggregateId);

    expect(event.aggregateId).toBe(aggregateId);
    expect(event.aggregateType).toBe('TestAggregate');
    expect(event.aggregateVersion).toBe(3);
    expect(event.eventName).toBe('TestOccurred');
    expect(event.eventVersion).toBe(1);
    expect(event.occurredAt.toISOString()).toBe('2026-07-21T15:00:00.000Z');
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
    expect(Object.isFrozen(event.payload.evidence)).toBe(true);
    expect(Object.isFrozen(event.metadata?.attributes?.source)).toBe(true);
  });

  it('protects the occurrence time with defensive copies', () => {
    const sourceDate = new Date('2026-07-21T15:00:00.000Z');
    const event = createEvent(TestAggregateId.create(uuidService.generate()), sourceDate);

    sourceDate.setUTCFullYear(2030);
    const exposedDate = event.occurredAt;
    exposedDate.setUTCFullYear(2040);

    expect(event.occurredAt.toISOString()).toBe('2026-07-21T15:00:00.000Z');
  });

  it.each([
    {
      aggregateType: '',
      aggregateVersion: 1,
      eventName: 'TestOccurred',
      eventVersion: 1,
      occurredAt: new Date(),
      error: TypeError,
    },
    {
      aggregateType: 'TestAggregate',
      aggregateVersion: 0,
      eventName: 'TestOccurred',
      eventVersion: 1,
      occurredAt: new Date(),
      error: RangeError,
    },
    {
      aggregateType: 'TestAggregate',
      aggregateVersion: 1,
      eventName: '',
      eventVersion: 1,
      occurredAt: new Date(),
      error: TypeError,
    },
    {
      aggregateType: 'TestAggregate',
      aggregateVersion: 1,
      eventName: 'TestOccurred',
      eventVersion: 0,
      occurredAt: new Date(),
      error: RangeError,
    },
    {
      aggregateType: 'TestAggregate',
      aggregateVersion: 1,
      eventName: 'TestOccurred',
      eventVersion: 1,
      occurredAt: new Date(Number.NaN),
      error: RangeError,
    },
  ])(
    'rejects an invalid event envelope',
    ({ aggregateType, aggregateVersion, eventName, eventVersion, occurredAt, error }) => {
      expect(
        () =>
          new DomainEvent({
            aggregateId: TestAggregateId.create(uuidService.generate()),
            aggregateType,
            aggregateVersion,
            eventId: uuidService.generate(),
            eventName,
            eventVersion,
            occurredAt,
          }),
      ).toThrow(error);
    },
  );
});

describe('AggregateRoot', () => {
  it('records events without publishing and exposes an immutable snapshot', () => {
    const aggregate = new TestAggregate(TestAggregateId.create(uuidService.generate()));
    const event = createEvent(aggregate.id);

    aggregate.record(event);
    const snapshot = aggregate.pendingDomainEvents;

    expect(snapshot).toEqual([event]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(aggregate.pendingDomainEvents).not.toBe(snapshot);
  });

  it('clears recorded events only when explicitly requested', () => {
    const aggregate = new TestAggregate(TestAggregateId.create(uuidService.generate()));
    aggregate.record(createEvent(aggregate.id));

    aggregate.clearDomainEvents();

    expect(aggregate.pendingDomainEvents).toEqual([]);
  });

  it('rejects events owned by another aggregate', () => {
    const aggregate = new TestAggregate(TestAggregateId.create(uuidService.generate()));
    const foreignEvent = createEvent(TestAggregateId.create(uuidService.generate()));

    expect(() => aggregate.record(foreignEvent)).toThrow(
      new TypeError('A domain event must belong to the aggregate that records it.'),
    );
    expect(aggregate.pendingDomainEvents).toEqual([]);
  });
});
