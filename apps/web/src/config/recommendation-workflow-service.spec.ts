import { describe, expect, it, vi } from 'vitest';
import { generateRecommendations, getActiveRecommendations } from './recommendation-service';
import { completeWorkflow, executeWorkflowStep, startWorkflow } from './workflow-service';

describe('Recommendation and Workflow Services', () => {
  it('generates and fetches active recommendations', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        generatedAt: new Date().toISOString(),
        id: 'rec-set-100',
        recommendedItems: [
          { confidence: 0.9, itemId: 'item-ddd', rank: 1, reasoning: 'High priority' },
        ],
        studentId: 'student-99',
      }),
      ok: true,
      status: 201,
    } as Response);

    const generated = await generateRecommendations('student-99');
    expect(generated.id).toBe('rec-set-100');
    expect(generated.recommendedItems.length).toBe(1);

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => generated,
      ok: true,
      status: 200,
    } as Response);

    const active = await getActiveRecommendations('student-99');
    expect(active.id).toBe('rec-set-100');
  });

  it('starts, executes step and completes workflow', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        currentStep: 'initialized',
        curriculumItemId: 'curr-101',
        id: 'wf-555',
        status: 'active',
        studentId: 'student-99',
      }),
      ok: true,
      status: 201,
    } as Response);

    const started = await startWorkflow('student-99', 'curr-101');
    expect(started.id).toBe('wf-555');

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        currentStep: 'content_retrieval',
        curriculumItemId: 'curr-101',
        id: 'wf-555',
        status: 'active',
        studentId: 'student-99',
      }),
      ok: true,
      status: 200,
    } as Response);

    const stepExec = await executeWorkflowStep('wf-555', { answer: 'test' });
    expect(stepExec.currentStep).toBe('content_retrieval');

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        currentStep: 'completed',
        curriculumItemId: 'curr-101',
        id: 'wf-555',
        status: 'completed',
        studentId: 'student-99',
      }),
      ok: true,
      status: 200,
    } as Response);

    const completed = await completeWorkflow('wf-555', 'Finished unit test');
    expect(completed.status).toBe('completed');
  });
});
