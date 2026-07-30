import { Entity } from '../../../../domain/entities/entity.js';
import type { RecommendationScoreId } from '../identifiers/recommendation-ids.js';
import type { PriorityScore } from '../value-objects/priority-score.js';
import type { RecommendationConfidence } from '../value-objects/recommendation-confidence.js';
import type { RecommendationWeight } from '../value-objects/recommendation-weight.js';

export interface CreateRecommendationScoreProps {
  readonly confidence: RecommendationConfidence;
  readonly id: RecommendationScoreId;
  readonly priority: PriorityScore;
  readonly weight: RecommendationWeight;
}

export class RecommendationScore extends Entity<RecommendationScoreId> {
  readonly priority: PriorityScore;
  readonly confidence: RecommendationConfidence;
  readonly weight: RecommendationWeight;

  private constructor(props: CreateRecommendationScoreProps) {
    super(props.id);
    this.priority = props.priority;
    this.confidence = props.confidence;
    this.weight = props.weight;
    Object.freeze(this);
  }

  static create(props: CreateRecommendationScoreProps): RecommendationScore {
    return new RecommendationScore(props);
  }

  get compositeScore(): number {
    return Number((this.priority.value * this.confidence.value * this.weight.value).toFixed(4));
  }
}
