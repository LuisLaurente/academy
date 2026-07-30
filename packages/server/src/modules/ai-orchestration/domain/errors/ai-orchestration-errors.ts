import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class AIOrchestrationError<
  TCode extends string = string,
> extends DomainError<TCode> {}

export class InvalidGenerationTransitionError extends AIOrchestrationError<'ai-orchestration.invalid-transition'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'ai-orchestration.invalid-transition',
      context: { reason },
      message: `Invalid generation transition: ${reason}`,
    });
  }
}

export class GenerationAlreadyCompletedError extends AIOrchestrationError<'ai-orchestration.already-completed'> {
  constructor(requestId: string) {
    super({
      category: 'domain-conflict',
      code: 'ai-orchestration.already-completed',
      context: { requestId },
      message: `The generation request '${requestId}' is already completed.`,
    });
  }
}

export class GenerationAlreadyRunningError extends AIOrchestrationError<'ai-orchestration.already-running'> {
  constructor(requestId: string) {
    super({
      category: 'domain-conflict',
      code: 'ai-orchestration.already-running',
      context: { requestId },
      message: `The generation request '${requestId}' is already running.`,
    });
  }
}

export class GenerationLimitExceededError extends AIOrchestrationError<'ai-orchestration.limit-exceeded'> {
  constructor(requestId: string, maxAttempts: number) {
    super({
      category: 'domain-conflict',
      code: 'ai-orchestration.limit-exceeded',
      context: { maxAttempts, requestId },
      message: `The generation request '${requestId}' exceeded maximum retries limit (${maxAttempts}).`,
    });
  }
}

export class GenerationRequestNotFoundError extends AIOrchestrationError<'ai-orchestration.request-not-found'> {
  constructor(requestId: string) {
    super({
      category: 'not-found',
      code: 'ai-orchestration.request-not-found',
      context: { requestId },
      message: `The generation request '${requestId}' was not found.`,
    });
  }
}

export class InvalidGenerationValueError extends AIOrchestrationError<'ai-orchestration.invalid-value'> {
  constructor(field: string, providedValue: unknown) {
    super({
      category: 'validation',
      code: 'ai-orchestration.invalid-value',
      context: { field, providedValue: String(providedValue) },
      message: `The supplied ${field} value is invalid: ${String(providedValue)}`,
    });
  }
}
