import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class EvaluationError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidSubmissionError extends EvaluationError<'evaluation.invalid-submission'> {
  constructor(reason: string) {
    super({
      category: 'validation',
      code: 'evaluation.invalid-submission',
      context: { reason },
      message: 'The submission is invalid.',
    });
  }
}
export class EvaluationAlreadyCompletedError extends EvaluationError<'evaluation.already-completed'> {
  constructor(status: string) {
    super({
      category: 'domain-conflict',
      code: 'evaluation.already-completed',
      context: { status },
      message: 'The evaluation is already in a terminal state.',
    });
  }
}
export class UnsupportedExerciseTypeError extends EvaluationError<'evaluation.unsupported-exercise-type'> {
  constructor(exerciseType: string) {
    super({
      category: 'validation',
      code: 'evaluation.unsupported-exercise-type',
      context: { exerciseType },
      message: 'No evaluator supports the requested exercise type.',
    });
  }
}
export class EvaluationTimeoutError extends EvaluationError<'evaluation.timeout'> {
  constructor(timeoutMilliseconds: number) {
    super({
      category: 'domain-conflict',
      code: 'evaluation.timeout',
      context: { timeoutMilliseconds },
      message: 'The evaluation exceeded its allowed execution time.',
    });
  }
}
export class InvalidEvaluationValueError extends EvaluationError<'evaluation.invalid-value'> {
  constructor(field: string) {
    super({
      category: 'validation',
      code: 'evaluation.invalid-value',
      context: { field },
      message: 'An evaluation value is invalid.',
    });
  }
}
export class EvaluationNotFoundError extends EvaluationError<'evaluation.not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'evaluation.not-found',
      message: 'The requested evaluation does not exist.',
    });
  }
}
export class InvalidEvaluationDateError extends EvaluationError<'evaluation.invalid-date'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'evaluation.invalid-date',
      context: { field },
      message: 'An evaluation timestamp is invalid.',
    });
  }
}
