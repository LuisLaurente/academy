import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class ApplicationWorkflowError<
  TCode extends string = string,
> extends DomainError<TCode> {}

export class InvalidWorkflowTransitionError extends ApplicationWorkflowError<'application-workflow.invalid-transition'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'application-workflow.invalid-transition',
      context: { reason },
      message: `Invalid workflow transition: ${reason}`,
    });
  }
}

export class WorkflowAlreadyCompletedError extends ApplicationWorkflowError<'application-workflow.already-completed'> {
  constructor(flowId: string) {
    super({
      category: 'domain-conflict',
      code: 'application-workflow.already-completed',
      context: { flowId },
      message: `The learning workflow '${flowId}' is already completed.`,
    });
  }
}

export class WorkflowExecutionFailedError extends ApplicationWorkflowError<'application-workflow.execution-failed'> {
  constructor(flowId: string, reason: string) {
    super({
      category: 'domain-conflict',
      code: 'application-workflow.execution-failed',
      context: { flowId, reason },
      message: `Execution failed for workflow '${flowId}': ${reason}`,
    });
  }
}

export class WorkflowNotFoundError extends ApplicationWorkflowError<'application-workflow.not-found'> {
  constructor(flowId: string) {
    super({
      category: 'not-found',
      code: 'application-workflow.not-found',
      context: { flowId },
      message: `The learning workflow '${flowId}' was not found.`,
    });
  }
}

export class InvalidWorkflowValueError extends ApplicationWorkflowError<'application-workflow.invalid-value'> {
  constructor(field: string, providedValue: unknown) {
    super({
      category: 'validation',
      code: 'application-workflow.invalid-value',
      context: { field, providedValue: String(providedValue) },
      message: `The supplied ${field} value is invalid: ${String(providedValue)}`,
    });
  }
}
