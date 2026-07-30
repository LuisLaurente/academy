import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionItem } from '../entities/session-item.js';
import { SessionAlreadyFinishedError, SessionItemNotFoundError } from '../errors/session-errors.js';
import {
  SessionFinished,
  SessionItemCompleted,
  SessionItemSkipped,
  SessionStarted,
} from '../events/session-events.js';
import type { SessionId } from '../identifiers/session-ids.js';
import { CompletedCount } from '../value-objects/completed-count.js';
import { CompletionRate } from '../value-objects/completion-rate.js';
import { SessionProgress } from '../value-objects/session-progress.js';
import { SkippedCount } from '../value-objects/skipped-count.js';

export type SessionStatus = 'active' | 'finished' | 'abandoned';

export interface StartLearningSessionProps {
  readonly createdAt?: Date;
  readonly eventId?: Uuid;
  readonly finishedAt?: Date | null;
  readonly id: SessionId;
  readonly items: readonly SessionItem[];
  readonly sessionStatus?: SessionStatus;
  readonly startedAt?: Date;
  readonly studentId: StudentId;
  readonly updatedAt?: Date;
}

export interface LearningSessionTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class LearningSession extends AggregateRoot<SessionId> {
  readonly studentId: StudentId;
  readonly startedAt: Date;

  private _finishedAt: Date | null;
  private _sessionStatus: SessionStatus;
  private _currentItem: SessionItem | null;
  private _pendingItems: SessionItem[];
  private _completedItems: SessionItem[];
  private _skippedItems: SessionItem[];
  private _totalExercises: number;
  private _completedExercises: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: StartLearningSessionProps) {
    super(props.id);
    this.studentId = props.studentId;
    this.startedAt = props.startedAt ?? new Date();
    this._finishedAt = props.finishedAt ?? null;
    this._sessionStatus = props.sessionStatus ?? 'active';
    this._createdAt = props.createdAt ?? this.startedAt;
    this._updatedAt = props.updatedAt ?? this._createdAt;

    const allItems = [...props.items].sort((a, b) => a.order - b.order);
    this._totalExercises = allItems.length;

    this._completedItems = allItems.filter((item) => item.status === 'completed');
    this._skippedItems = allItems.filter((item) => item.status === 'skipped');
    this._completedExercises = this._completedItems.length;

    this._pendingItems = allItems.filter(
      (item) => item.status === 'pending' || item.status === 'active',
    );

    if (this._pendingItems.length > 0) {
      this._currentItem = this._pendingItems.shift() ?? null;
      this._currentItem?.activate();
    } else {
      this._currentItem = null;
    }
  }

  static start(props: StartLearningSessionProps): LearningSession {
    const session = new LearningSession(props);

    if (props.eventId) {
      session.recordDomainEvent(
        new SessionStarted({
          aggregateId: session.id,
          aggregateVersion: 1,
          eventId: props.eventId,
          occurredAt: session.startedAt,
          startedAt: session.startedAt,
          studentId: session.studentId,
          totalExercises: session.totalExercises,
        }),
      );
    }

    return session;
  }

  get finishedAt(): Date | null {
    return this._finishedAt;
  }

  get sessionStatus(): SessionStatus {
    return this._sessionStatus;
  }

  get currentItem(): SessionItem | null {
    return this._currentItem;
  }

  get completedItems(): readonly SessionItem[] {
    return Object.freeze([...this._completedItems]);
  }

  get skippedItems(): readonly SessionItem[] {
    return Object.freeze([...this._skippedItems]);
  }

  get totalExercises(): number {
    return this._totalExercises;
  }

  get completedExercises(): number {
    return this._completedExercises;
  }

  get timestamps(): LearningSessionTimestamps {
    return Object.freeze({
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  isFinished(): boolean {
    return this._sessionStatus === 'finished' || this._sessionStatus === 'abandoned';
  }

  getProgress(): SessionProgress {
    const completedCountRes = CompletedCount.create(this._completedExercises);
    const completedCount = completedCountRes.isSuccess
      ? completedCountRes.value
      : CompletedCount.zero();

    const skippedCountRes = SkippedCount.create(this._skippedItems.length);
    const skippedCount = skippedCountRes.isSuccess ? skippedCountRes.value : SkippedCount.zero();

    const currentIndex = this._completedItems.length + this._skippedItems.length;

    return SessionProgress.create({
      completedCount,
      currentItemIndex: currentIndex,
      skippedCount,
      totalCount: this._totalExercises,
    });
  }

  completeCurrentItem(
    score?: number,
    eventId?: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this.isFinished()) {
      return Result.failure(new SessionAlreadyFinishedError(this.id.toString()));
    }

    if (!this._currentItem) {
      return Result.failure(new SessionItemNotFoundError('No active item in session'));
    }

    const item = this._currentItem;
    const completeRes = item.complete(score, now);
    if (!completeRes.isSuccess) {
      return completeRes;
    }

    this._completedItems.push(item);
    this._completedExercises += 1;
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new SessionItemCompleted({
          aggregateId: this.id,
          aggregateVersion: 1,
          completedAt: now,
          eventId,
          itemId: item.itemId,
          itemType: item.itemType,
          occurredAt: now,
          score: score ?? null,
          sessionItemId: item.id,
          studentId: this.studentId,
        }),
      );
    }

    this.advanceToNextItem();

    return Result.success(undefined);
  }

  skipCurrentItem(eventId?: Uuid, now = new Date()): ResultType<void, DomainError> {
    if (this.isFinished()) {
      return Result.failure(new SessionAlreadyFinishedError(this.id.toString()));
    }

    if (!this._currentItem) {
      return Result.failure(new SessionItemNotFoundError('No active item in session'));
    }

    const item = this._currentItem;
    const skipRes = item.skip(now);
    if (!skipRes.isSuccess) {
      return skipRes;
    }

    this._skippedItems.push(item);
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new SessionItemSkipped({
          aggregateId: this.id,
          aggregateVersion: 1,
          eventId,
          itemId: item.itemId,
          itemType: item.itemType,
          occurredAt: now,
          sessionItemId: item.id,
          skippedAt: now,
          studentId: this.studentId,
        }),
      );
    }

    this.advanceToNextItem();

    return Result.success(undefined);
  }

  finish(eventId?: Uuid, now = new Date()): ResultType<void, DomainError> {
    if (this.isFinished()) {
      return Result.failure(new SessionAlreadyFinishedError(this.id.toString()));
    }

    this._sessionStatus = 'finished';
    this._finishedAt = now;
    this._updatedAt = now;
    this._currentItem = null;

    if (eventId) {
      const rate = CompletionRate.fromCounts(this._completedExercises, this._totalExercises).value;

      this.recordDomainEvent(
        new SessionFinished({
          aggregateId: this.id,
          aggregateVersion: 1,
          completedExercises: this._completedExercises,
          completionRate: rate,
          eventId,
          finishedAt: now,
          occurredAt: now,
          skippedExercises: this._skippedItems.length,
          startedAt: this.startedAt,
          studentId: this.studentId,
          totalExercises: this._totalExercises,
        }),
      );
    }

    return Result.success(undefined);
  }

  abandon(now = new Date()): ResultType<void, DomainError> {
    if (this.isFinished()) {
      return Result.failure(new SessionAlreadyFinishedError(this.id.toString()));
    }

    this._sessionStatus = 'abandoned';
    this._finishedAt = now;
    this._updatedAt = now;
    this._currentItem = null;

    return Result.success(undefined);
  }

  private advanceToNextItem(): void {
    if (this._pendingItems.length > 0) {
      this._currentItem = this._pendingItems.shift() ?? null;
      this._currentItem?.activate();
    } else {
      this._currentItem = null;
    }
  }
}
