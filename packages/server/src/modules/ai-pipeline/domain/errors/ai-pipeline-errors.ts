import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class AIPipelineError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidAIValueError extends AIPipelineError<'ai-pipeline.invalid-value'> {
  constructor(field: string, constraint: string) {
    super({
      category: 'validation',
      code: 'ai-pipeline.invalid-value',
      context: { constraint, field },
      message: 'An AI pipeline value does not satisfy its constraints.',
    });
  }
}

export class InvalidGenerationStateError extends AIPipelineError<'ai-pipeline.invalid-state'> {
  constructor(currentState: string, operation: string) {
    super({
      category: 'domain-conflict',
      code: 'ai-pipeline.invalid-state',
      context: { currentState, operation },
      message: 'The generation cannot perform this operation in its current state.',
    });
  }
}

export class GenerationNotApprovableError extends AIPipelineError<'ai-pipeline.not-approvable'> {
  constructor(failedGate: string) {
    super({
      category: 'domain-conflict',
      code: 'ai-pipeline.not-approvable',
      context: { failedGate },
      message: 'The generation has not passed every mandatory acceptance gate.',
    });
  }
}

export class GenerationNotFoundError extends AIPipelineError<'ai-pipeline.not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'ai-pipeline.not-found',
      message: 'The requested AI generation does not exist.',
    });
  }
}

export class PromptTemplateNotFoundError extends AIPipelineError<'ai-pipeline.template-not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'ai-pipeline.template-not-found',
      message: 'The requested prompt template does not exist or is not active.',
    });
  }
}

export class UnsupportedGeneratorError extends AIPipelineError<'ai-pipeline.unsupported-generator'> {
  constructor(generator: string) {
    super({
      category: 'validation',
      code: 'ai-pipeline.unsupported-generator',
      context: { generator },
      message: 'The requested generator is not enabled.',
    });
  }
}

export class PipelineComponentError extends AIPipelineError<'ai-pipeline.component-failure'> {
  constructor(component: string) {
    super({
      category: 'invariant',
      code: 'ai-pipeline.component-failure',
      context: { component },
      message: 'An AI pipeline component could not complete its contract.',
    });
  }
}

export class PublicationDeniedError extends AIPipelineError<'ai-pipeline.publication-denied'> {
  constructor() {
    super({
      category: 'domain-conflict',
      code: 'ai-pipeline.publication-denied',
      message: 'The publication gate denied this generation.',
    });
  }
}

export class InvalidGenerationDateError extends AIPipelineError<'ai-pipeline.invalid-date'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'ai-pipeline.invalid-date',
      context: { field },
      message: 'An AI generation date is invalid.',
    });
  }
}

export class InvalidGenerationVersionError extends AIPipelineError<'ai-pipeline.invalid-version'> {
  constructor() {
    super({
      category: 'invariant',
      code: 'ai-pipeline.invalid-version',
      message: 'The generation version must be a positive safe integer.',
    });
  }
}
