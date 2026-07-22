import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class ExerciseError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidExerciseTextError extends ExerciseError<'exercises.invalid-text'> {
  constructor(field: string, minimumLength: number, maximumLength: number) {
    super({
      category: 'validation',
      code: 'exercises.invalid-text',
      context: { field, maximumLength, minimumLength },
      message: 'Exercise text does not satisfy its length constraints.',
    });
  }
}
export class InvalidExerciseValueError extends ExerciseError<'exercises.invalid-value'> {
  constructor(field: string) {
    super({
      category: 'validation',
      code: 'exercises.invalid-value',
      context: { field },
      message: 'An exercise value is invalid.',
    });
  }
}
export class DuplicateExerciseElementError extends ExerciseError<'exercises.duplicate-element'> {
  constructor(elementType: string, conflictingField: string) {
    super({
      category: 'domain-conflict',
      code: 'exercises.duplicate-element',
      context: { conflictingField, elementType },
      message: 'An exercise element conflicts with an existing element.',
    });
  }
}
export class ExerciseSetAlreadyExistsError extends ExerciseError<'exercises.set-exists'> {
  constructor() {
    super({
      category: 'domain-conflict',
      code: 'exercises.set-exists',
      message: 'An exercise set already exists for this lesson.',
    });
  }
}
export class ExerciseSetNotFoundError extends ExerciseError<'exercises.set-not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'exercises.set-not-found',
      message: 'The requested exercise set does not exist.',
    });
  }
}
export class ExerciseNotFoundError extends ExerciseError<'exercises.exercise-not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'exercises.exercise-not-found',
      message: 'The requested exercise does not exist.',
    });
  }
}
export class InvalidExerciseSetStateError extends ExerciseError<'exercises.invalid-state'> {
  constructor(state: string) {
    super({
      category: 'domain-conflict',
      code: 'exercises.invalid-state',
      context: { state },
      message: 'The exercise set cannot be modified in its current state.',
    });
  }
}
export class IncompleteExerciseSetError extends ExerciseError<'exercises.incomplete-set'> {
  constructor(reason: string) {
    super({
      category: 'invariant',
      code: 'exercises.incomplete-set',
      context: { reason },
      message: 'The exercise set does not satisfy its publication invariants.',
    });
  }
}
export class ExerciseSetCapacityError extends ExerciseError<'exercises.capacity-exceeded'> {
  constructor() {
    super({
      category: 'invariant',
      code: 'exercises.capacity-exceeded',
      message: 'An exercise set cannot contain more than 30 exercises.',
    });
  }
}
export class InvalidExerciseProgressionError extends ExerciseError<'exercises.invalid-progression'> {
  constructor(reason: string) {
    super({
      category: 'invariant',
      code: 'exercises.invalid-progression',
      context: { reason },
      message: 'The exercise progression is invalid.',
    });
  }
}
export class InvalidExerciseDateError extends ExerciseError<'exercises.invalid-date'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'exercises.invalid-date',
      context: { field },
      message: 'An exercise set date is invalid.',
    });
  }
}
