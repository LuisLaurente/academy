export interface GenerateRecommendationsInput {
  readonly candidateLimit?: number;
  readonly reason?: string;
  readonly setId?: string;
  readonly studentId: string;
  readonly ttlHours?: number;
}

export interface RankRecommendationsInput {
  readonly customCriteria?: string;
  readonly setId: string;
}

export interface SelectRecommendationInput {
  readonly recommendationId: string;
  readonly selectedAt?: Date;
  readonly setId: string;
}

export interface ConsumeRecommendationInput {
  readonly consumedAt?: Date;
  readonly recommendationId: string;
  readonly setId: string;
}
