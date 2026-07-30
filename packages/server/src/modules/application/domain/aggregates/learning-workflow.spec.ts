import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { WorkflowResult } from '../entities/workflow-result.js';
import { WorkflowStepExecution } from '../entities/workflow-step-execution.js';
import {
  ApplicationFlowId,
  WorkflowExecutionId,
  WorkflowResultId,
} from '../identifiers/application-ids.js';
import { ExecutionDuration } from '../value-objects/execution-duration.js';
import { LearningWorkflow } from './learning-workflow.js';

const uuidService = new CryptoUuidService();

function unwrap<T>(result: {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: unknown;
}): T {
  if (result.isSuccess) return result.value as T;
  throw result.error;
}

describe('LearningWorkflow aggregate root', () => {
  const createTestWorkflow = () => {
    const flowId = ApplicationFlowId.create(uuidService.generate());
    const studentId = StudentId.create(uuidService.generate());

    const workflow = LearningWorkflow.start({
      curriculumItemId: 'curr-100',
      eventId: uuidService.generate(),
      id: flowId,
      studentId,
    });

    return { flowId, studentId, workflow };
  };

  it('starts workflow and records WorkflowStarted event', () => {
    const { flowId, studentId, workflow } = createTestWorkflow();

    expect(workflow.id.equals(flowId)).toBe(true);
    expect(workflow.studentId.equals(studentId)).toBe(true);
    expect(workflow.curriculumItemId).toBe('curr-100');
    expect(workflow.workflowStatus.state).toBe('running');
    expect(workflow.currentStep.name).toBe('curriculum_selection');
    expect(workflow.pendingDomainEvents.length).toBe(1);
    expect(workflow.pendingDomainEvents[0]?.eventName).toBe('WorkflowStarted');
  });

  it('executes step and advances current step sequence', () => {
    const { workflow } = createTestWorkflow();
    workflow.clearDomainEvents();

    const execution = WorkflowStepExecution.create({
      id: WorkflowExecutionId.create(uuidService.generate()),
      step: workflow.currentStep,
    });

    const result = workflow.executeStep(execution, uuidService.generate());

    expect(result.isSuccess).toBe(true);
    expect(workflow.currentStep.name).toBe('content_retrieval');
    expect(workflow.stepExecutions.length).toBe(1);
    expect(workflow.pendingDomainEvents.length).toBe(1);
    expect(workflow.pendingDomainEvents[0]?.eventName).toBe('WorkflowStepCompleted');
  });

  it('completes workflow cleanly with result', () => {
    const { workflow } = createTestWorkflow();
    workflow.clearDomainEvents();

    const result = WorkflowResult.create({
      completedAt: new Date(),
      executedStepsCount: 8,
      id: WorkflowResultId.create(uuidService.generate()),
      summary: 'Success',
      totalDuration: unwrap(ExecutionDuration.create(5000)),
    });

    const completeRes = workflow.complete(result, uuidService.generate());

    expect(completeRes.isSuccess).toBe(true);
    expect(workflow.workflowStatus.state).toBe('completed');
    expect(workflow.currentStep.name).toBe('completed');
    expect(workflow.completedAt).not.toBeNull();
    expect(workflow.result).toBe(result);
    expect(workflow.pendingDomainEvents.length).toBe(1);
    expect(workflow.pendingDomainEvents[0]?.eventName).toBe('WorkflowCompleted');
  });

  it('fails workflow and records WorkflowFailed event', () => {
    const { workflow } = createTestWorkflow();
    workflow.clearDomainEvents();

    const failRes = workflow.fail('Unexpected error', uuidService.generate());

    expect(failRes.isSuccess).toBe(true);
    expect(workflow.workflowStatus.state).toBe('failed');
    expect(workflow.completedAt).not.toBeNull();
    expect(workflow.pendingDomainEvents.length).toBe(1);
    expect(workflow.pendingDomainEvents[0]?.eventName).toBe('WorkflowFailed');
  });

  it('cancels workflow', () => {
    const { workflow } = createTestWorkflow();

    const cancelRes = workflow.cancel();
    expect(cancelRes.isSuccess).toBe(true);
    expect(workflow.workflowStatus.state).toBe('cancelled');
  });

  it('rejects executing step or completing when workflow is terminal', () => {
    const { workflow } = createTestWorkflow();
    workflow.fail('Error');

    const execution = WorkflowStepExecution.create({
      id: WorkflowExecutionId.create(uuidService.generate()),
      step: workflow.currentStep,
    });

    const execRes = workflow.executeStep(execution);
    expect(execRes.isSuccess).toBe(false);
    if (!execRes.isSuccess) {
      expect(execRes.error.code).toBe('application-workflow.already-completed');
    }
  });
});
