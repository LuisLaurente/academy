import { apiFetch } from './api-client.js';

export interface CurriculumItem {
  readonly description: string;
  readonly difficulty: string;
  readonly estimatedMins: number;
  readonly id: string;
  readonly title: string;
}

export async function getCurriculumItems(): Promise<readonly CurriculumItem[]> {
  return apiFetch<readonly CurriculumItem[]>('/curriculum/items');
}

export async function getCurriculumItemById(id: string): Promise<CurriculumItem> {
  return apiFetch<CurriculumItem>(`/curriculum/items/${id}`);
}
