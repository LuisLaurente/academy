import type { Uuid } from '../../core/identifiers/uuid-service.js';
import type { EntityId } from '../identity/entity-id.js';

export type DomainEventPrimitive = boolean | number | string | null;
export type DomainEventValue = DomainEventPrimitive | DomainEventData | readonly DomainEventValue[];
export interface DomainEventData {
  readonly [key: string]: DomainEventValue;
}

export interface DomainEventMetadata {
  readonly actorId?: string;
  readonly attributes?: DomainEventData;
  readonly causationId?: Uuid;
  readonly correlationId?: Uuid;
}

export interface DomainEventOptions<
  TAggregateIdentity extends EntityId<string>,
  TEventName extends string,
> {
  readonly aggregateId: TAggregateIdentity;
  readonly aggregateType: string;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly eventName: TEventName;
  readonly eventVersion: number;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
  readonly payload?: DomainEventData;
}

export class DomainEvent<
  TAggregateIdentity extends EntityId<string> = EntityId<string>,
  TEventName extends string = string,
> {
  readonly aggregateId: TAggregateIdentity;
  readonly aggregateType: string;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly eventName: TEventName;
  readonly eventVersion: number;
  readonly metadata: DomainEventMetadata | undefined;
  readonly payload: DomainEventData;

  private readonly occurredAtEpochMilliseconds: number;

  constructor(options: DomainEventOptions<TAggregateIdentity, TEventName>) {
    if (options.aggregateType.trim().length === 0) {
      throw new TypeError('Domain event aggregate type must not be empty.');
    }

    if (!Number.isSafeInteger(options.aggregateVersion) || options.aggregateVersion < 1) {
      throw new RangeError('Domain event aggregate version must be a positive safe integer.');
    }

    if (options.eventName.trim().length === 0) {
      throw new TypeError('Domain event name must not be empty.');
    }

    if (!Number.isSafeInteger(options.eventVersion) || options.eventVersion < 1) {
      throw new RangeError('Domain event version must be a positive safe integer.');
    }

    const occurredAtEpochMilliseconds = options.occurredAt.getTime();

    if (!Number.isFinite(occurredAtEpochMilliseconds)) {
      throw new RangeError('Domain event occurrence time must be valid.');
    }

    this.aggregateId = options.aggregateId;
    this.aggregateType = options.aggregateType;
    this.aggregateVersion = options.aggregateVersion;
    this.eventId = options.eventId;
    this.eventName = options.eventName;
    this.eventVersion = options.eventVersion;
    this.metadata = freezeMetadata(options.metadata);
    this.occurredAtEpochMilliseconds = occurredAtEpochMilliseconds;
    this.payload = freezeData(options.payload ?? {});

    Object.freeze(this);
  }

  get occurredAt(): Date {
    return new Date(this.occurredAtEpochMilliseconds);
  }
}

function freezeMetadata(
  metadata: DomainEventMetadata | undefined,
): DomainEventMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({
    ...metadata,
    ...(metadata.attributes === undefined ? {} : { attributes: freezeData(metadata.attributes) }),
  });
}

function freezeData(data: DomainEventData): DomainEventData {
  const entries = Object.entries(data).map(([key, value]) => [key, freezeValue(value)] as const);

  return Object.freeze(Object.fromEntries(entries));
}

function freezeValue(value: DomainEventValue): DomainEventValue {
  if (isDomainEventValueArray(value)) {
    return Object.freeze(value.map((item) => freezeValue(item)));
  }

  if (typeof value === 'object' && value !== null) {
    return freezeData(value);
  }

  return value;
}

function isDomainEventValueArray(value: DomainEventValue): value is readonly DomainEventValue[] {
  return Array.isArray(value);
}
