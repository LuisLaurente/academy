import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { Recommendation } from '../entities/recommendation.js';
import {
  RecommendationExpiredError,
  RecommendationNotFoundError,
} from '../errors/recommendation-errors.js';
import {
  RecommendationConsumed,
  RecommendationsExpired,
  RecommendationsGenerated,
  RecommendationSelected,
} from '../events/recommendation-events.js';
import type { RecommendationId, RecommendationSetId } from '../identifiers/recommendation-ids.js';
import type { ExpirationTime } from '../value-objects/expiration-time.js';

export interface CreateRecommendationSetProps {
  readonly createdAt?: Date;
  readonly eventId?: Uuid;
  readonly expiresAt: ExpirationTime;
  readonly generatedAt?: Date;
  readonly generationReason: string;
  readonly id: RecommendationSetId;
  readonly recommendations: readonly Recommendation[];
  readonly studentId: StudentId;
  readonly updatedAt?: Date;
}

export interface RecommendationSetTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class RecommendationSet extends AggregateRoot<RecommendationSetId> {
  readonly studentId: StudentId;
  readonly generatedAt: Date;
  readonly expiresAt: ExpirationTime;
  readonly generationReason: string;

  private _createdAt: Date;
  private _updatedAt: Date;
  private _recommendations: Recommendation[];

  private constructor(props: CreateRecommendationSetProps) {
    super(props.id);
    this.studentId = props.studentId;
    this.generatedAt = props.generatedAt ?? new Date();
    this.expiresAt = props.expiresAt;
    this.generationReason = props.generationReason;
    this._createdAt = props.createdAt ?? this.generatedAt;
    this._updatedAt = props.updatedAt ?? this._createdAt;
    this._recommendations = [...props.recommendations];
  }

  static create(props: CreateRecommendationSetProps): RecommendationSet {
    const set = new RecommendationSet(props);

    if (props.eventId) {
      set.recordDomainEvent(
        new RecommendationsGenerated({
          aggregateId: set.id,
          aggregateVersion: 1,
          count: set._recommendations.length,
          eventId: props.eventId,
          expiresAt: set.expiresAt.value,
          generationReason: set.generationReason,
          occurredAt: set.generatedAt,
          studentId: set.studentId,
        }),
      );
    }

    return set;
  }

  get recommendations(): readonly Recommendation[] {
    return Object.freeze([...this._recommendations]);
  }

  get timestamps(): RecommendationSetTimestamps {
    return Object.freeze({
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt.isExpired(now);
  }

  expireAll(eventId: Uuid, now = new Date()): ResultType<void, DomainError> {
    for (const rec of this._recommendations) {
      rec.expire();
    }
    this._updatedAt = now;

    this.recordDomainEvent(
      new RecommendationsExpired({
        aggregateId: this.id,
        aggregateVersion: 1,
        eventId,
        expiredCount: this._recommendations.length,
        occurredAt: now,
        studentId: this.studentId,
      }),
    );

    return Result.success(undefined);
  }

  selectRecommendation(
    recommendationId: RecommendationId,
    eventId: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this.isExpired(now)) {
      return Result.failure(
        new RecommendationExpiredError(this.id.toString(), this.expiresAt.value),
      );
    }

    const rec = this._recommendations.find((r) => r.id.equals(recommendationId));
    if (!rec) {
      return Result.failure(new RecommendationNotFoundError(recommendationId.toString()));
    }

    const selectRes = rec.select(now);
    if (!selectRes.isSuccess) {
      return selectRes;
    }

    this._updatedAt = now;

    this.recordDomainEvent(
      new RecommendationSelected({
        aggregateId: this.id,
        aggregateVersion: 1,
        eventId,
        itemId: rec.itemId,
        itemType: rec.itemType,
        occurredAt: now,
        recommendationId: rec.id,
        studentId: this.studentId,
      }),
    );

    return Result.success(undefined);
  }

  consumeRecommendation(
    recommendationId: RecommendationId,
    eventId: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this.isExpired(now)) {
      return Result.failure(
        new RecommendationExpiredError(this.id.toString(), this.expiresAt.value),
      );
    }

    const rec = this._recommendations.find((r) => r.id.equals(recommendationId));
    if (!rec) {
      return Result.failure(new RecommendationNotFoundError(recommendationId.toString()));
    }

    const consumeRes = rec.consume(now);
    if (!consumeRes.isSuccess) {
      return consumeRes;
    }

    this._updatedAt = now;

    this.recordDomainEvent(
      new RecommendationConsumed({
        aggregateId: this.id,
        aggregateVersion: 1,
        consumedAt: now,
        eventId,
        itemId: rec.itemId,
        itemType: rec.itemType,
        occurredAt: now,
        recommendationId: rec.id,
        studentId: this.studentId,
      }),
    );

    return Result.success(undefined);
  }

  reRank(rankedRecommendations: readonly Recommendation[]): void {
    this._recommendations = [...rankedRecommendations];
    this._updatedAt = new Date();
  }
}
