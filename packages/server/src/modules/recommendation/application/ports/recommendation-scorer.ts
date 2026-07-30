import type { RecommendationScore } from '../../domain/entities/recommendation-score.js';
import type { RecommendationCandidate } from './recommendation-strategy.js';

export interface RecommendationScorer {
  scoreCandidate(candidate: RecommendationCandidate): RecommendationScore;
}
