import { apiFetch } from './api-client';

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

export interface GenerateSyllabusResponse {
  readonly status: 'duplicate_found' | 'success' | 'error';
  readonly duplicates?: readonly CurriculumItem[];
  readonly id?: string;
  readonly message?: string;
}

export async function generateSyllabus(
  topic: string,
  provider = 'gemini',
  forceNew = false,
): Promise<GenerateSyllabusResponse> {
  return apiFetch<GenerateSyllabusResponse>('/curriculum/generate', {
    method: 'POST',
    body: JSON.stringify({ topic, provider, forceNew }),
  });
}
