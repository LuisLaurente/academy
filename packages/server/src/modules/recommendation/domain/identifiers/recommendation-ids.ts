import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class RecommendationSetId extends EntityId<'RecommendationSet'> {
  static create(value: Uuid): RecommendationSetId {
    return new RecommendationSetId(value);
  }
}

export class RecommendationId extends EntityId<'Recommendation'> {
  static create(value: Uuid): RecommendationId {
    return new RecommendationId(value);
  }
}

export class RecommendationReasonId extends EntityId<'RecommendationReason'> {
  static create(value: Uuid): RecommendationReasonId {
    return new RecommendationReasonId(value);
  }
}

export class RecommendationScoreId extends EntityId<'RecommendationScore'> {
  static create(value: Uuid): RecommendationScoreId {
    return new RecommendationScoreId(value);
  }
}
