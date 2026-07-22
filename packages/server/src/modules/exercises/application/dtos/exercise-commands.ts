import type { LessonId } from '../../../curriculum/index.js';
import type {
  ExerciseId,
  ExerciseSetId,
  HintId,
  SolutionId,
} from '../../domain/identifiers/exercise-identifiers.js';

export interface CreateExerciseSetInput {
  readonly lessonId: LessonId;
}
export interface CreateExerciseSetOutput {
  readonly exerciseSetId: ExerciseSetId;
  readonly version: number;
}
export interface TestCaseInput {
  readonly expectedOutput: string;
  readonly hidden: boolean;
  readonly input: string;
}
export interface AddExerciseInput {
  readonly difficulty: string;
  readonly estimatedMinutes: number;
  readonly expectedResult?: string;
  readonly exerciseSetId: ExerciseSetId;
  readonly explanation: string;
  readonly language: string;
  readonly order: number;
  readonly starterCode?: string;
  readonly statement: string;
  readonly testCases?: readonly TestCaseInput[];
  readonly title: string;
  readonly type: string;
  readonly validationMode: string;
  readonly validationRule?: string;
}
export interface AddExerciseOutput {
  readonly exerciseId: ExerciseId;
  readonly version: number;
}
export interface AddHintInput {
  readonly exerciseId: ExerciseId;
  readonly exerciseSetId: ExerciseSetId;
  readonly text: string;
}
export interface AddHintOutput {
  readonly hintId: HintId;
  readonly version: number;
}
export interface AddSolutionInput {
  readonly answer: string;
  readonly exerciseId: ExerciseId;
  readonly exerciseSetId: ExerciseSetId;
  readonly explanation: string;
}
export interface AddSolutionOutput {
  readonly solutionId: SolutionId;
  readonly version: number;
}
export interface PublishExerciseSetInput {
  readonly exerciseSetId: ExerciseSetId;
}
export interface ExerciseSetVersionOutput {
  readonly version: number;
}
