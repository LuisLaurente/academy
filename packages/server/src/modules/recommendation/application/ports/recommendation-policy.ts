import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationSet } from '../../domain/aggregates/recommendation-set.js';

export interface RecommendationPolicy {
  canGenerateRecommendations(studentId: StudentId): boolean;
  isSetValid(set: RecommendationSet, now?: Date): boolean;
  maxRecommendationsPerSet(): number;
}
