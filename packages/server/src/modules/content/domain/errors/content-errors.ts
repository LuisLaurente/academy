import { DomainError } from '../../../../core/errors/domain-error.js';

export abstract class ContentError<TCode extends string = string> extends DomainError<TCode> {}

export class InvalidContentTextError extends ContentError<'content.invalid-text'> {
  constructor(field: string, minimumLength: number, maximumLength: number) {
    super({
      category: 'validation',
      code: 'content.invalid-text',
      context: { field, maximumLength, minimumLength },
      message: 'Content text does not satisfy its length constraints.',
    });
  }
}

export class InvalidDisplayOrderError extends ContentError<'content.invalid-display-order'> {
  constructor() {
    super({
      category: 'validation',
      code: 'content.invalid-display-order',
      message: 'Display order must be a positive safe integer.',
    });
  }
}

export class InvalidContentMetadataError extends ContentError<'content.invalid-metadata'> {
  constructor(field: string) {
    super({
      category: 'validation',
      code: 'content.invalid-metadata',
      context: { field },
      message: 'Content metadata is invalid.',
    });
  }
}

export class DuplicateContentElementError extends ContentError<'content.duplicate-element'> {
  constructor(elementType: string, conflictingField: string) {
    super({
      category: 'domain-conflict',
      code: 'content.duplicate-element',
      context: { conflictingField, elementType },
      message: 'A content element conflicts with an existing element.',
    });
  }
}

export class LessonContentAlreadyExistsError extends ContentError<'content.lesson-content-exists'> {
  constructor() {
    super({
      category: 'domain-conflict',
      code: 'content.lesson-content-exists',
      message: 'An active content aggregate already exists for this lesson.',
    });
  }
}

export class LessonContentNotFoundError extends ContentError<'content.not-found'> {
  constructor() {
    super({
      category: 'not-found',
      code: 'content.not-found',
      message: 'The requested lesson content does not exist.',
    });
  }
}

export class InvalidContentStateError extends ContentError<'content.invalid-state'> {
  constructor(state: string) {
    super({
      category: 'domain-conflict',
      code: 'content.invalid-state',
      context: { state },
      message: 'Lesson content cannot be modified in its current state.',
    });
  }
}

export class IncompleteLessonContentError extends ContentError<'content.incomplete'> {
  constructor(reason: string) {
    super({
      category: 'invariant',
      code: 'content.incomplete',
      context: { reason },
      message: 'Lesson content is not complete enough to satisfy its invariants.',
    });
  }
}

export class InvalidContentDateError extends ContentError<'content.invalid-date'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'content.invalid-date',
      context: { field },
      message: 'A lesson content date is invalid.',
    });
  }
}

export class InvalidContentVersionError extends ContentError<'content.invalid-version'> {
  constructor(field: string) {
    super({
      category: 'invariant',
      code: 'content.invalid-version',
      context: { field },
      message: 'A content version must be a positive safe integer.',
    });
  }
}
