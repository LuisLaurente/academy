import { apiFetch } from './api-client';

export interface SubmitEvaluationPayload {
  readonly exerciseId: string;
  readonly feedback?: string;
  readonly isPassed: boolean;
  readonly score: number;
  readonly studentId: string;
}

export interface EvaluationResponse {
  readonly evaluatedAt: string;
  readonly exerciseId: string;
  readonly feedback?: string;
  readonly id: string;
  readonly isPassed: boolean;
  readonly score: number;
  readonly studentId: string;
}

export async function submitEvaluation(
  payload: SubmitEvaluationPayload,
): Promise<EvaluationResponse> {
  return apiFetch<EvaluationResponse>('/evaluations/submit', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function getStudentEvaluations(
  studentId: string,
): Promise<readonly EvaluationResponse[]> {
  return apiFetch<readonly EvaluationResponse[]>(`/evaluations/student/${studentId}`);
}
