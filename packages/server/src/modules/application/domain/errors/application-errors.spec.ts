import { describe, expect, it } from 'vitest';
import {
  InvalidWorkflowTransitionError,
  InvalidWorkflowValueError,
  WorkflowAlreadyCompletedError,
  WorkflowExecutionFailedError,
  WorkflowNotFoundError,
} from './application-errors.js';

describe('Application Workflow domain errors', () => {
  it.each([
    [
      new InvalidWorkflowTransitionError('invalid step'),
      'application-workflow.invalid-transition',
      'validation',
    ],
    [
      new WorkflowAlreadyCompletedError('flow-1'),
      'application-workflow.already-completed',
      'domain-conflict',
    ],
    [
      new WorkflowExecutionFailedError('flow-2', 'timeout'),
      'application-workflow.execution-failed',
      'domain-conflict',
    ],
    [new WorkflowNotFoundError('flow-99'), 'application-workflow.not-found', 'not-found'],
    [
      new InvalidWorkflowValueError('status', 'unknown'),
      'application-workflow.invalid-value',
      'validation',
    ],
  ] as const)('provides stable code and category for %s', (error, code, category) => {
    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.message).toBeTruthy();
  });
});
