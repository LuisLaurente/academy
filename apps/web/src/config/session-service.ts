import { apiFetch } from './api-client.js';

export interface SessionResponse {
  readonly completedCount: number;
  readonly id: string;
  readonly status: string;
  readonly studentId: string;
}

export async function startSession(
  studentId: string,
  itemIds: readonly string[],
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/sessions/start', {
    body: JSON.stringify({ itemIds, studentId }),
    method: 'POST',
  });
}

export async function completeSessionItem(
  sessionId: string,
  itemId: string,
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>(`/sessions/${sessionId}/complete-item`, {
    body: JSON.stringify({ itemId }),
    method: 'POST',
  });
}

export async function finishSession(sessionId: string): Promise<SessionResponse> {
  return apiFetch<SessionResponse>(`/sessions/${sessionId}/finish`, {
    method: 'POST',
  });
}
