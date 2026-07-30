import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { ApplicationFlowId } from '../identifiers/application-ids.js';
import {
  WorkflowCompleted,
  WorkflowFailed,
  WorkflowStarted,
  WorkflowStepCompleted,
} from './application-events.js';

const uuidService = new CryptoUuidService();

describe('Application Workflow domain events', () => {
  const flowId = ApplicationFlowId.create(uuidService.generate());
  const studentId = StudentId.create(uuidService.generate());
  const occurredAt = new Date('2026-07-22T00:00:00.000Z');
  const envelope = {
    aggregateId: flowId,
    aggregateVersion: 1,
    eventId: uuidService.generate(),
    occurredAt,
  } as const;

  it('creates WorkflowStarted event', () => {
    const event = new WorkflowStarted({
      ...envelope,
      curriculumItemId: 'curr-101',
      startedAt: occurredAt,
      studentId,
    });

    expect(event.eventName).toBe('WorkflowStarted');
    expect(event.aggregateType).toBe('LearningWorkflow');
    expect(event.payload).toEqual({
      curriculumItemId: 'curr-101',
      startedAt: occurredAt.toISOString(),
      studentId: studentId.toString(),
    });
  });

  it('creates WorkflowStepCompleted event', () => {
    const event = new WorkflowStepCompleted({
      ...envelope,
      durationMs: 450,
      stepName: 'curriculum_selection',
      studentId,
    });

    expect(event.eventName).toBe('WorkflowStepCompleted');
    expect(event.payload).toEqual({
      durationMs: 450,
      stepName: 'curriculum_selection',
      studentId: studentId.toString(),
    });
  });

  it('creates WorkflowCompleted event', () => {
    const completedAt = new Date('2026-07-22T00:05:00.000Z');
    const event = new WorkflowCompleted({
      ...envelope,
      completedAt,
      executedStepsCount: 8,
      sessionId: 'sess-10',
      studentId,
      totalDurationMs: 300000,
    });

    expect(event.eventName).toBe('WorkflowCompleted');
    expect(event.payload).toEqual({
      completedAt: completedAt.toISOString(),
      executedStepsCount: 8,
      sessionId: 'sess-10',
      studentId: studentId.toString(),
      totalDurationMs: 300000,
    });
  });

  it('creates WorkflowFailed event', () => {
    const failedAt = new Date('2026-07-22T00:01:00.000Z');
    const event = new WorkflowFailed({
      ...envelope,
      failedAt,
      failedStepName: 'evaluation_processing',
      reason: 'Evaluation service unreachable',
      studentId,
    });

    expect(event.eventName).toBe('WorkflowFailed');
    expect(event.payload).toEqual({
      failedAt: failedAt.toISOString(),
      failedStepName: 'evaluation_processing',
      reason: 'Evaluation service unreachable',
      studentId: studentId.toString(),
    });
  });
});
