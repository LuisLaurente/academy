import type { Uuid } from '../../../../../core/identifiers/uuid-service.js';
import {
  DomainEvent,
  type DomainEventMetadata,
} from '../../../../../domain/events/domain-event.js';
import type { SessionId, UserId } from '../identifiers/authentication-ids.js';

interface AuthenticationEventEnvelope<TAggregateId> {
  readonly aggregateId: TAggregateId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

interface SessionEventEnvelope extends AuthenticationEventEnvelope<SessionId> {
  readonly userId: UserId;
}

export class UserRegistered extends DomainEvent<UserId, 'UserRegistered'> {
  constructor(options: AuthenticationEventEnvelope<UserId>) {
    super({
      ...options,
      aggregateType: 'User',
      eventName: 'UserRegistered',
      eventVersion: 1,
    });
  }
}

export class UserLoggedIn extends DomainEvent<SessionId, 'UserLoggedIn'> {
  constructor(options: SessionEventEnvelope) {
    const { userId, ...envelope } = options;

    super({
      ...envelope,
      aggregateType: 'Session',
      eventName: 'UserLoggedIn',
      eventVersion: 1,
      payload: { userId: userId.toString() },
    });
  }
}

export class UserLoggedOut extends DomainEvent<SessionId, 'UserLoggedOut'> {
  constructor(options: SessionEventEnvelope) {
    const { userId, ...envelope } = options;

    super({
      ...envelope,
      aggregateType: 'Session',
      eventName: 'UserLoggedOut',
      eventVersion: 1,
      payload: { userId: userId.toString() },
    });
  }
}

export class SessionRefreshed extends DomainEvent<SessionId, 'SessionRefreshed'> {
  constructor(options: SessionEventEnvelope) {
    const { userId, ...envelope } = options;

    super({
      ...envelope,
      aggregateType: 'Session',
      eventName: 'SessionRefreshed',
      eventVersion: 1,
      payload: { userId: userId.toString() },
    });
  }
}
