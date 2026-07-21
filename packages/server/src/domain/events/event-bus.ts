import type { DomainEvent } from './domain-event.js';

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: readonly DomainEvent[]): Promise<void>;
}
