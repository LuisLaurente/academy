import type { DomainError } from '../../../../core/errors/domain-error.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { Entity } from '../../../../domain/entities/entity.js';
import { InvalidSessionTransitionError } from '../errors/session-errors.js';
import type { SessionItemId } from '../identifiers/session-ids.js';

export type SessionItemStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface CreateSessionItemProps {
  readonly completedAt?: Date | null;
  readonly id: SessionItemId;
  readonly itemId: string;
  readonly itemType: string;
  readonly order: number;
  readonly score?: number | null;
  readonly skippedAt?: Date | null;
  readonly status?: SessionItemStatus;
}

export class SessionItem extends Entity<SessionItemId> {
  readonly itemId: string;
  readonly itemType: string;
  readonly order: number;

  private _status: SessionItemStatus;
  private _completedAt: Date | null;
  private _skippedAt: Date | null;
  private _score: number | null;

  private constructor(props: CreateSessionItemProps) {
    super(props.id);
    this.itemId = props.itemId;
    this.itemType = props.itemType;
    this.order = props.order;
    this._status = props.status ?? 'pending';
    this._completedAt = props.completedAt ?? null;
    this._skippedAt = props.skippedAt ?? null;
    this._score = props.score ?? null;
  }

  static create(props: CreateSessionItemProps): SessionItem {
    return new SessionItem(props);
  }

  get status(): SessionItemStatus {
    return this._status;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get skippedAt(): Date | null {
    return this._skippedAt;
  }

  get score(): number | null {
    return this._score;
  }

  activate(): void {
    if (this._status === 'pending') {
      this._status = 'active';
    }
  }

  complete(score?: number, now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'completed') {
      return Result.failure(new InvalidSessionTransitionError('Item is already completed'));
    }

    this._status = 'completed';
    this._completedAt = now;
    if (score !== undefined && Number.isFinite(score)) {
      this._score = score;
    }
    return Result.success(undefined);
  }

  skip(now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'completed' || this._status === 'skipped') {
      return Result.failure(
        new InvalidSessionTransitionError('Item is already finished or skipped'),
      );
    }

    this._status = 'skipped';
    this._skippedAt = now;
    return Result.success(undefined);
  }
}
