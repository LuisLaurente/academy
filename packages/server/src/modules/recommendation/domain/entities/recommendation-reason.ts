import { Entity } from '../../../../domain/entities/entity.js';
import type { RecommendationReasonId } from '../identifiers/recommendation-ids.js';
import type { RecommendationWeight } from '../value-objects/recommendation-weight.js';

export interface CreateRecommendationReasonProps {
  readonly code: string;
  readonly description: string;
  readonly id: RecommendationReasonId;
  readonly weight: RecommendationWeight;
}

export class RecommendationReason extends Entity<RecommendationReasonId> {
  readonly code: string;
  readonly description: string;
  readonly weight: RecommendationWeight;

  private constructor(props: CreateRecommendationReasonProps) {
    super(props.id);
    this.code = props.code;
    this.description = props.description;
    this.weight = props.weight;
    Object.freeze(this);
  }

  static create(props: CreateRecommendationReasonProps): RecommendationReason {
    return new RecommendationReason(props);
  }
}
