import { apiFetch } from './api-client.js';

export interface RecommendedItem {
  readonly confidence: number;
  readonly itemId: string;
  readonly rank: number;
  readonly reasoning?: string;
}

export interface RecommendationSet {
  readonly generatedAt: string;
  readonly id: string;
  readonly recommendedItems: readonly RecommendedItem[];
  readonly studentId: string;
}

export async function generateRecommendations(studentId: string): Promise<RecommendationSet> {
  return apiFetch<RecommendationSet>('/recommendations/generate', {
    body: JSON.stringify({ studentId }),
    method: 'POST',
  });
}

export async function getActiveRecommendations(studentId: string): Promise<RecommendationSet> {
  return apiFetch<RecommendationSet>(`/recommendations/active/${studentId}`);
}
