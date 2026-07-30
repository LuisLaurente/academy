import type { DomainError } from '../../../../core/errors/domain-error.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { Entity } from '../../../../domain/entities/entity.js';
import {
  RecommendationAlreadyConsumedError,
  InvalidRecommendationStateError,
} from '../errors/recommendation-errors.js';
import type { RecommendationId } from '../identifiers/recommendation-ids.js';
import type { RecommendationRank } from '../value-objects/recommendation-rank.js';
import type { RecommendationReason } from './recommendation-reason.js';
import type { RecommendationScore } from './recommendation-score.js';

export type RecommendationItemType = 'curriculum_item' | 'exercise' | 'content';
export type RecommendationStatus = 'pending' | 'selected' | 'consumed' | 'expired';

export interface CreateRecommendationProps {
  readonly consumedAt?: Date | null;
  readonly id: RecommendationId;
  readonly itemId: string;
  readonly itemType: RecommendationItemType;
  readonly rank: RecommendationRank;
  readonly reason: RecommendationReason;
  readonly score: RecommendationScore;
  readonly selectedAt?: Date | null;
  readonly status?: RecommendationStatus;
}

export class Recommendation extends Entity<RecommendationId> {
  readonly itemId: string;
  readonly itemType: RecommendationItemType;
  readonly score: RecommendationScore;
  readonly reason: RecommendationReason;

  private _rank: RecommendationRank;
  private _status: RecommendationStatus;
  private _selectedAt: Date | null;
  private _consumedAt: Date | null;

  private constructor(props: CreateRecommendationProps) {
    super(props.id);
    this.itemId = props.itemId;
    this.itemType = props.itemType;
    this.score = props.score;
    this.reason = props.reason;
    this._rank = props.rank;
    this._status = props.status ?? 'pending';
    this._selectedAt = props.selectedAt ?? null;
    this._consumedAt = props.consumedAt ?? null;
  }

  static create(props: CreateRecommendationProps): Recommendation {
    return new Recommendation(props);
  }

  get rank(): RecommendationRank {
    return this._rank;
  }

  get status(): RecommendationStatus {
    return this._status;
  }

  get selectedAt(): Date | null {
    return this._selectedAt;
  }

  get consumedAt(): Date | null {
    return this._consumedAt;
  }

  updateRank(newRank: RecommendationRank): void {
    this._rank = newRank;
  }

  select(now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'consumed') {
      return Result.failure(new RecommendationAlreadyConsumedError(this.id.toString()));
    }
    if (this._status === 'expired') {
      return Result.failure(
        new InvalidRecommendationStateError('Cannot select an expired recommendation'),
      );
    }

    this._status = 'selected';
    this._selectedAt = now;
    return Result.success(undefined);
  }

  consume(now = new Date()): ResultType<void, DomainError> {
    if (this._status === 'consumed') {
      return Result.failure(new RecommendationAlreadyConsumedError(this.id.toString()));
    }
    if (this._status === 'expired') {
      return Result.failure(
        new InvalidRecommendationStateError('Cannot consume an expired recommendation'),
      );
    }

    this._status = 'consumed';
    this._consumedAt = now;
    if (this._selectedAt === null) {
      this._selectedAt = now;
    }
    return Result.success(undefined);
  }

  expire(): void {
    if (this._status !== 'consumed') {
      this._status = 'expired';
    }
  }
}
