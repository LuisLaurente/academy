import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationItemType } from '../../domain/entities/recommendation.js';

export interface RecommendationCandidate {
  readonly initialPriority: number;
  readonly itemId: string;
  readonly itemType: RecommendationItemType;
  readonly reasonCode: string;
  readonly reasonDescription: string;
}

export interface RecommendationStrategy {
  generateCandidates(
    studentId: StudentId,
    context?: {
      readonly candidateLimit?: number;
      readonly excludeItemIds?: readonly string[];
    },
  ): Promise<readonly RecommendationCandidate[]>;
}
