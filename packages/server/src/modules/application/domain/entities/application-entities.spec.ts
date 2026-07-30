import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { WorkflowExecutionId, WorkflowResultId } from '../identifiers/application-ids.js';
import { ExecutionDuration } from '../value-objects/execution-duration.js';
import { WorkflowStep } from '../value-objects/workflow-step.js';
import { WorkflowResult } from './workflow-result.js';
import { WorkflowStepExecution } from './workflow-step-execution.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('Application Workflow domain entities', () => {
  describe('WorkflowStepExecution', () => {
    it('creates, completes and fails step execution', () => {
      const execId = WorkflowExecutionId.create(uuidService.generate());
      const step = WorkflowStep.initial();

      const execution = WorkflowStepExecution.create({
        id: execId,
        step,
      });

      expect(execution.status).toBe('pending');
      expect(execution.completedAt).toBeNull();

      const duration = unwrap(ExecutionDuration.create(500));
      execution.complete(duration);

      expect(execution.status).toBe('success');
      expect(execution.duration?.durationMs).toBe(500);
      expect(execution.completedAt).not.toBeNull();
    });
  });

  describe('WorkflowResult', () => {
    it('creates WorkflowResult entity', () => {
      const resultId = WorkflowResultId.create(uuidService.generate());
      const duration = unwrap(ExecutionDuration.create(12000));
      const completedAt = new Date();

      const result = WorkflowResult.create({
        completedAt,
        executedStepsCount: 8,
        id: resultId,
        summary: 'Full flow completed cleanly',
        totalDuration: duration,
      });

      expect(result.id.equals(resultId)).toBe(true);
      expect(result.executedStepsCount).toBe(8);
      expect(result.totalDuration.inSeconds).toBe(12);
      expect(result.summary).toBe('Full flow completed cleanly');
    });
  });
});
