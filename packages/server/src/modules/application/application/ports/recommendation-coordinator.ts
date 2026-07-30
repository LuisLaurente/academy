import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';

export interface RecommendationCoordinatorResult {
  readonly recommendedItemIds: readonly string[];
  readonly setId: string;
}

export interface RecommendationCoordinator {
  fetchNextRecommendations(
    studentId: StudentId,
    limit?: number,
  ): Promise<RecommendationCoordinatorResult>;
}
