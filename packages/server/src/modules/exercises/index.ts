export type {
  AddExerciseInput,
  AddExerciseOutput,
  AddHintInput,
  AddHintOutput,
  AddSolutionInput,
  AddSolutionOutput,
  CreateExerciseSetInput,
  CreateExerciseSetOutput,
  ExerciseSetVersionOutput,
  PublishExerciseSetInput,
  TestCaseInput,
} from './application/dtos/exercise-commands.js';
export type { ExerciseSetRepository } from './application/ports/exercise-set-repository.js';
export {
  AddExercise,
  AddHint,
  AddSolution,
  CreateExerciseSet,
  PublishExerciseSet,
  type ExerciseUseCaseDependencies,
} from './application/use-cases/exercise-use-cases.js';
export {
  ExerciseSet,
  type ExerciseSetState,
  type ExerciseTransition,
} from './domain/aggregates/exercise-set.js';
export {
  Exercise,
  ExpectedResult,
  Hint,
  Solution,
  StarterCode,
  TestCase,
  ValidationRule,
  type ExerciseState,
} from './domain/entities/exercise-elements.js';
export {
  DuplicateExerciseElementError,
  ExerciseError,
  ExerciseNotFoundError,
  ExerciseSetAlreadyExistsError,
  ExerciseSetCapacityError,
  ExerciseSetNotFoundError,
  IncompleteExerciseSetError,
  InvalidExerciseDateError,
  InvalidExerciseProgressionError,
  InvalidExerciseSetStateError,
  InvalidExerciseTextError,
  InvalidExerciseValueError,
} from './domain/errors/exercise-errors.js';
export {
  ExerciseAdded,
  ExerciseSetCreated,
  ExerciseSetPublished,
  HintAdded,
  SolutionAdded,
  type ExerciseEventEnvelope,
} from './domain/events/exercise-events.js';
export {
  ExerciseId,
  ExerciseSetId,
  HintId,
  SolutionId,
  TestCaseId,
} from './domain/identifiers/exercise-identifiers.js';
export {
  DIFFICULTIES,
  EXERCISE_SET_SIZE,
  EXERCISE_TYPES,
  MAXIMUM_MULTIPLE_CHOICE_EXERCISES,
  VALIDATION_MODES,
  type Difficulty,
  type ExerciseSetStatus,
  type ExerciseType,
  type ValidationModeValue,
} from './domain/types/exercise-types.js';
export {
  DifficultyLevel,
  EstimatedMinutes,
  ExerciseExplanation,
  ExerciseOrder,
  ExerciseStatement,
  ExerciseTitle,
  HintText,
  ProgrammingLanguage,
  SolutionExplanation,
  ValidationMode,
} from './domain/value-objects/exercise-value-objects.js';
export {
  InMemoryExerciseSetRepository,
  InMemoryExercisesUnitOfWork,
} from './infrastructure/testing/in-memory-exercises.js';
