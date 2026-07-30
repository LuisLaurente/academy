import { apiFetch } from './api-client.js';

export interface Exercise {
  readonly difficulty: string;
  readonly exerciseType: string;
  readonly id: string;
  readonly prompt: string;
  readonly title: string;
}

export async function getExerciseById(id: string): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`);
}

export async function createExercise(exercise: Exercise): Promise<Exercise> {
  return apiFetch<Exercise>('/exercises', {
    body: JSON.stringify(exercise),
    method: 'POST',
  });
}
