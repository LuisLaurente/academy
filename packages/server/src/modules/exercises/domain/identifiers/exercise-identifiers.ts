import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class ExerciseSetId extends EntityId<'ExerciseSet'> {
  static create(value: Uuid): ExerciseSetId {
    return new ExerciseSetId(value);
  }
}
export class ExerciseId extends EntityId<'Exercise'> {
  static create(value: Uuid): ExerciseId {
    return new ExerciseId(value);
  }
}
export class HintId extends EntityId<'Hint'> {
  static create(value: Uuid): HintId {
    return new HintId(value);
  }
}
export class SolutionId extends EntityId<'Solution'> {
  static create(value: Uuid): SolutionId {
    return new SolutionId(value);
  }
}
export class TestCaseId extends EntityId<'TestCase'> {
  static create(value: Uuid): TestCaseId {
    return new TestCaseId(value);
  }
}
