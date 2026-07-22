import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import { ReviewHistory } from '../entities/review-history.js';
import { LearningMetrics } from '../entities/learning-metrics.js';
import {
  InvalidLearningTransitionError,
  LearningRecordLockedError,
} from '../errors/learning-errors.js';
import {
  LearningProgressUpdated,
  LearningRecordCreated,
  MasteryReached,
  ReviewScheduled,
} from '../events/learning-events.js';
import {
  LearningMetricsId,
  type LearningRecordId,
  ReviewHistoryId,
  type StudentId,
} from '../identifiers/learning-ids.js';
import { AttemptCount } from '../value-objects/attempt-count.js';
import { ConfidenceScore } from '../value-objects/confidence-score.js';
import { MasteryScore } from '../value-objects/mastery-score.js';
import { RetentionScore } from '../value-objects/retention-score.js';
import { ReviewInterval } from '../value-objects/review-interval.js';
import { SuccessRate } from '../value-objects/success-rate.js';

export interface CreateLearningRecordProps {
  readonly attempts?: AttemptCount;
  readonly confidence?: ConfidenceScore;
  readonly createdAt?: Date;
  readonly difficultyAdjustment?: number;
  readonly eventId?: Uuid;
  readonly failures?: AttemptCount;
  readonly id: LearningRecordId;
  readonly lastReviewedAt?: Date | null;
  readonly locked?: boolean;
  readonly mastery?: MasteryScore;
  readonly metrics?: LearningMetrics;
  readonly nextReviewAt?: Date | null;
  readonly retention?: RetentionScore;
  readonly reviewHistory?: readonly ReviewHistory[];
  readonly studentId: StudentId;
  readonly successes?: AttemptCount;
  readonly updatedAt?: Date;
}

export interface LearningRecordTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EventContext {
  readonly aggregateVersion?: number;
  readonly eventId: Uuid;
  readonly occurredAt?: Date;
}

export class LearningRecord extends AggregateRoot<LearningRecordId> {
  readonly studentId: StudentId;

  private _mastery: MasteryScore;
  private _confidence: ConfidenceScore;
  private _retention: RetentionScore;
  private _attempts: AttemptCount;
  private _successes: AttemptCount;
  private _failures: AttemptCount;
  private _lastReviewedAt: Date | null;
  private _nextReviewAt: Date | null;
  private _difficultyAdjustment: number;
  private _locked: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _metrics: LearningMetrics;
  private readonly _reviewHistory: ReviewHistory[];

  private constructor(props: CreateLearningRecordProps) {
    super(props.id);
    this.studentId = props.studentId;
    this._mastery = props.mastery ?? MasteryScore.zero();
    this._confidence = props.confidence ?? ConfidenceScore.default();
    this._retention = props.retention ?? RetentionScore.max();
    this._attempts = props.attempts ?? AttemptCount.zero();
    this._successes = props.successes ?? AttemptCount.zero();
    this._failures = props.failures ?? AttemptCount.zero();
    this._lastReviewedAt = props.lastReviewedAt ?? null;
    this._nextReviewAt = props.nextReviewAt ?? null;
    this._difficultyAdjustment = props.difficultyAdjustment ?? 1.0;
    this._locked = props.locked ?? false;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
    this._metrics =
      props.metrics ?? LearningMetrics.empty(LearningMetricsId.create(props.id.value));
    this._reviewHistory = props.reviewHistory ? [...props.reviewHistory] : [];
  }

  static create(props: CreateLearningRecordProps): LearningRecord {
    const record = new LearningRecord(props);

    if (props.eventId) {
      record.recordDomainEvent(
        new LearningRecordCreated({
          aggregateId: record.id,
          aggregateVersion: 1,
          eventId: props.eventId,
          occurredAt: record.timestamps.createdAt,
          studentId: record.studentId,
        }),
      );
    }

    return record;
  }

  get mastery(): MasteryScore {
    return this._mastery;
  }

  get confidence(): ConfidenceScore {
    return this._confidence;
  }

  get retention(): RetentionScore {
    return this._retention;
  }

  get attempts(): AttemptCount {
    return this._attempts;
  }

  get successes(): AttemptCount {
    return this._successes;
  }

  get failures(): AttemptCount {
    return this._failures;
  }

  get lastReviewedAt(): Date | null {
    return this._lastReviewedAt;
  }

  get nextReviewAt(): Date | null {
    return this._nextReviewAt;
  }

  get difficultyAdjustment(): number {
    return this._difficultyAdjustment;
  }

  get locked(): boolean {
    return this._locked;
  }

  get timestamps(): LearningRecordTimestamps {
    return Object.freeze({
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  get metrics(): LearningMetrics {
    return this._metrics;
  }

  get reviewHistory(): readonly ReviewHistory[] {
    return Object.freeze([...this._reviewHistory]);
  }

  lock(): void {
    this._locked = true;
  }

  unlock(): void {
    this._locked = false;
  }

  isReviewDue(now = new Date()): boolean {
    if (this._nextReviewAt === null) {
      return false;
    }
    return now.getTime() >= this._nextReviewAt.getTime();
  }

  calculateSuccessRate(): SuccessRate {
    return SuccessRate.fromAttempts(this._successes, this._attempts);
  }

  updateProgress(
    params: {
      readonly confidence?: ConfidenceScore | undefined;
      readonly mastery?: MasteryScore | undefined;
      readonly responseTimeMs?: number | undefined;
      readonly retention?: RetentionScore | undefined;
      readonly reviewedAt?: Date | undefined;
      readonly score: number;
      readonly success: boolean;

      // Optional entity inputs
      readonly reviewHistoryId?: ReviewHistoryId | undefined;
    },
    eventContext: EventContext,
  ): ResultType<void, DomainError> {
    if (this._locked) {
      return Result.failure(new LearningRecordLockedError(this.id.toString()));
    }

    const reviewedAt = params.reviewedAt ?? eventContext.occurredAt ?? new Date();

    if (this._lastReviewedAt !== null && reviewedAt.getTime() < this._lastReviewedAt.getTime()) {
      return Result.failure(
        new InvalidLearningTransitionError(
          'Review timestamp cannot be in the past of last reviewed at.',
        ),
      );
    }

    const previousMastery = this._mastery;
    const previousConfidence = this._confidence;
    const previousRetention = this._retention;

    this._attempts = this._attempts.increment();
    if (params.success) {
      this._successes = this._successes.increment();
    } else {
      this._failures = this._failures.increment();
    }

    this._lastReviewedAt = reviewedAt;
    this._updatedAt = reviewedAt;

    if (params.mastery) {
      this._mastery = params.mastery;
    }
    if (params.confidence) {
      this._confidence = params.confidence;
    }
    if (params.retention) {
      this._retention = params.retention;
    }

    this._metrics = this._metrics.recordAttempt(params.success, params.responseTimeMs);

    const historyEntry = ReviewHistory.create({
      confidenceAfter: this._confidence,
      confidenceBefore: previousConfidence,
      id: params.reviewHistoryId ?? ReviewHistoryId.create(eventContext.eventId),
      intervalAfter: ReviewInterval.zero(),
      intervalBefore: ReviewInterval.zero(),
      masteryAfter: this._mastery,
      masteryBefore: previousMastery,
      responseTimeMs: params.responseTimeMs ?? null,
      retentionAfter: this._retention,
      retentionBefore: previousRetention,
      reviewedAt,
      score: params.score,
      success: params.success,
    });
    this._reviewHistory.push(historyEntry);

    this.recordDomainEvent(
      new LearningProgressUpdated({
        aggregateId: this.id,
        aggregateVersion: eventContext.aggregateVersion ?? 1,
        attempts: this._attempts.value,
        confidence: this._confidence.value,
        eventId: eventContext.eventId,
        mastery: this._mastery.value,
        occurredAt: reviewedAt,
        retention: this._retention.value,
        score: params.score,
        studentId: this.studentId,
        success: params.success,
      }),
    );

    if (this._mastery.isMastered() && !previousMastery.isMastered()) {
      this.recordDomainEvent(
        new MasteryReached({
          aggregateId: this.id,
          aggregateVersion: eventContext.aggregateVersion ?? 1,
          eventId: eventContext.eventId,
          masteryScore: this._mastery.value,
          occurredAt: reviewedAt,
          studentId: this.studentId,
        }),
      );
    }

    return Result.success(undefined);
  }

  scheduleReview(
    params: {
      readonly interval: ReviewInterval;
      readonly nextReviewAt: Date;
    },
    eventContext: EventContext,
  ): ResultType<void, DomainError> {
    if (this._locked) {
      return Result.failure(new LearningRecordLockedError(this.id.toString()));
    }

    const scheduledAt = eventContext.occurredAt ?? new Date();

    if (params.nextReviewAt.getTime() < scheduledAt.getTime()) {
      return Result.failure(
        new InvalidLearningTransitionError('Next review date cannot be scheduled in the past.'),
      );
    }

    this._nextReviewAt = params.nextReviewAt;
    this._updatedAt = scheduledAt;

    this.recordDomainEvent(
      new ReviewScheduled({
        aggregateId: this.id,
        aggregateVersion: eventContext.aggregateVersion ?? 1,
        eventId: eventContext.eventId,
        intervalDays: params.interval.inDays,
        nextReviewAt: params.nextReviewAt,
        occurredAt: scheduledAt,
        studentId: this.studentId,
      }),
    );

    return Result.success(undefined);
  }
}
