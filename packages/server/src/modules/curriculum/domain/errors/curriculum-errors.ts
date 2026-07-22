import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class CurriculumError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidCurriculumTextError extends CurriculumError<'curriculum.invalid-text'> {
  constructor(field: string, minimumLength: number, maximumLength: number) {
    super({
      category: 'validation',
      code: 'curriculum.invalid-text',
      context: { field, maximumLength, minimumLength },
      message: 'Curriculum text does not satisfy its length constraints.',
    });
  }
}

export class InvalidLearningOrderError extends CurriculumError<'curriculum.invalid-learning-order'> {
  constructor() {
    super({
      category: 'validation',
      code: 'curriculum.invalid-learning-order',
      message: 'Learning order must be a positive safe integer.',
    });
  }
}

export class InvalidDifficultyLevelError extends CurriculumError<'curriculum.invalid-difficulty-level'> {
  constructor() {
    super({
      category: 'validation',
      code: 'curriculum.invalid-difficulty-level',
      message: 'Difficulty level must be an integer between one and five.',
    });
  }
}

export class DuplicateCurriculumElementError extends CurriculumError<'curriculum.duplicate-element'> {
  constructor(elementType: string, conflictingField: string) {
    super({
      category: 'domain-conflict',
      code: 'curriculum.duplicate-element',
      context: { conflictingField, elementType },
      message: 'A curriculum element conflicts with an existing sibling.',
    });
  }
}

export class CurriculumElementNotFoundError extends CurriculumError<'curriculum.element-not-found'> {
  constructor(elementType: string) {
    super({
      category: 'not-found',
      code: 'curriculum.element-not-found',
      context: { elementType },
      message: 'The requested curriculum element does not exist in this topic.',
    });
  }
}

export class IncompleteCurriculumHierarchyError extends CurriculumError<'curriculum.incomplete-hierarchy'> {
  constructor(reason: string) {
    super({
      category: 'invariant',
      code: 'curriculum.incomplete-hierarchy',
      context: { reason },
      message: 'The curriculum hierarchy is not structurally complete.',
    });
  }
}

export class InvalidCurriculumStateError extends CurriculumError<'curriculum.invalid-state'> {
  constructor(state: string) {
    super({
      category: 'domain-conflict',
      code: 'curriculum.invalid-state',
      context: { state },
      message: 'The curriculum cannot be modified in its current state.',
    });
  }
}

export class InvalidCurriculumDateError extends CurriculumError<'curriculum.invalid-date'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'curriculum.invalid-date',
      context: { field },
      message: 'A curriculum date is invalid.',
    });
  }
}
