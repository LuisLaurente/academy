import { Entity } from '../../../../domain/entities/entity.js';
import type { ReviewHistoryId } from '../identifiers/learning-ids.js';
import type { ConfidenceScore } from '../value-objects/confidence-score.js';
import type { MasteryScore } from '../value-objects/mastery-score.js';
import type { RetentionScore } from '../value-objects/retention-score.js';
import type { ReviewInterval } from '../value-objects/review-interval.js';

export interface CreateReviewHistoryProps {
  readonly confidenceAfter: ConfidenceScore;
  readonly confidenceBefore: ConfidenceScore;
  readonly id: ReviewHistoryId;
  readonly intervalAfter: ReviewInterval;
  readonly intervalBefore: ReviewInterval;
  readonly masteryAfter: MasteryScore;
  readonly masteryBefore: MasteryScore;
  readonly responseTimeMs?: number | null;
  readonly retentionAfter: RetentionScore;
  readonly retentionBefore: RetentionScore;
  readonly reviewedAt: Date;
  readonly score: number;
  readonly success: boolean;
}

export class ReviewHistory extends Entity<ReviewHistoryId> {
  readonly reviewedAt: Date;
  readonly success: boolean;
  readonly score: number;
  readonly confidenceBefore: ConfidenceScore;
  readonly confidenceAfter: ConfidenceScore;
  readonly masteryBefore: MasteryScore;
  readonly masteryAfter: MasteryScore;
  readonly retentionBefore: RetentionScore;
  readonly retentionAfter: RetentionScore;
  readonly intervalBefore: ReviewInterval;
  readonly intervalAfter: ReviewInterval;
  readonly responseTimeMs: number | null;

  private constructor(props: CreateReviewHistoryProps) {
    super(props.id);
    this.reviewedAt = props.reviewedAt;
    this.success = props.success;
    this.score = props.score;
    this.confidenceBefore = props.confidenceBefore;
    this.confidenceAfter = props.confidenceAfter;
    this.masteryBefore = props.masteryBefore;
    this.masteryAfter = props.masteryAfter;
    this.retentionBefore = props.retentionBefore;
    this.retentionAfter = props.retentionAfter;
    this.intervalBefore = props.intervalBefore;
    this.intervalAfter = props.intervalAfter;
    this.responseTimeMs = props.responseTimeMs ?? null;
    Object.freeze(this);
  }

  static create(props: CreateReviewHistoryProps): ReviewHistory {
    return new ReviewHistory(props);
  }
}
