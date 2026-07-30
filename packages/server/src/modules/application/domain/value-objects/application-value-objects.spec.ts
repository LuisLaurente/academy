import { describe, expect, it } from 'vitest';
import { ExecutionDuration } from './execution-duration.js';
import { WorkflowStatus } from './workflow-status.js';
import { WorkflowStep } from './workflow-step.js';

describe('Application Workflow value objects', () => {
  describe('WorkflowStatus', () => {
    it('creates valid WorkflowStatus and checks terminal state', () => {
      const res = WorkflowStatus.create('running');
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.state).toBe('running');
        expect(res.value.isTerminal).toBe(false);
        expect(res.value.toString()).toBe('running');
      }

      expect(WorkflowStatus.completed().isTerminal).toBe(true);
      expect(WorkflowStatus.failed().isTerminal).toBe(true);
      expect(WorkflowStatus.cancelled().isTerminal).toBe(true);
      expect(WorkflowStatus.pending().isTerminal).toBe(false);
    });

    it('rejects invalid status', () => {
      expect(WorkflowStatus.create('unknown').isSuccess).toBe(false);
    });
  });

  describe('WorkflowStep', () => {
    it('creates valid WorkflowStep and steps through sequence', () => {
      const initial = WorkflowStep.initial();
      expect(initial.name).toBe('curriculum_selection');
      expect(initial.sequenceIndex).toBe(0);

      const next1 = initial.next();
      expect(next1.name).toBe('content_retrieval');
      expect(next1.sequenceIndex).toBe(1);

      const completed = WorkflowStep.completed();
      expect(completed.name).toBe('completed');
      expect(completed.next().name).toBe('completed');
    });

    it('rejects invalid step name', () => {
      expect(WorkflowStep.create('invalid_step').isSuccess).toBe(false);
    });
  });

  describe('ExecutionDuration', () => {
    it('creates valid ExecutionDuration', () => {
      const res = ExecutionDuration.create(3500);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.durationMs).toBe(3500);
        expect(res.value.inSeconds).toBe(3.5);
        expect(res.value.toString()).toBe('3.5s');
      }

      expect(ExecutionDuration.zero().durationMs).toBe(0);
    });

    it('calculates duration between dates', () => {
      const start = new Date('2026-07-22T00:00:00.000Z');
      const end = new Date('2026-07-22T00:00:10.000Z');
      const res = ExecutionDuration.between(start, end);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.inSeconds).toBe(10);
      }
    });
  });
});
