import type { Recommendation } from '../../domain/entities/recommendation.js';

export interface RecommendationRanker {
  rankRecommendations(recommendations: readonly Recommendation[]): readonly Recommendation[];
}
