import { apiFetch } from './api-client.js';

export interface WorkflowResponse {
  readonly currentStep: string;
  readonly curriculumItemId: string;
  readonly id: string;
  readonly status: string;
  readonly studentId: string;
}

export async function startWorkflow(
  studentId: string,
  curriculumItemId: string,
): Promise<WorkflowResponse> {
  return apiFetch<WorkflowResponse>('/workflows/start', {
    body: JSON.stringify({ curriculumItemId, studentId }),
    method: 'POST',
  });
}

export async function executeWorkflowStep(
  workflowId: string,
  payload?: Record<string, unknown>,
): Promise<WorkflowResponse> {
  return apiFetch<WorkflowResponse>(`/workflows/${workflowId}/execute-step`, {
    body: JSON.stringify(payload ?? {}),
    method: 'POST',
  });
}

export async function completeWorkflow(
  workflowId: string,
  summary: string,
): Promise<WorkflowResponse> {
  return apiFetch<WorkflowResponse>(`/workflows/${workflowId}/complete`, {
    body: JSON.stringify({ summary }),
    method: 'POST',
  });
}
