import type { LessonId } from '../../../curriculum/index.js';
import type { ExerciseSet } from '../../domain/aggregates/exercise-set.js';
import type { ExerciseSetId } from '../../domain/identifiers/exercise-identifiers.js';

export interface ExerciseSetRepository {
  findById(id: ExerciseSetId): Promise<ExerciseSet | undefined>;
  findByLessonId(lessonId: LessonId): Promise<ExerciseSet | undefined>;
  save(exerciseSet: ExerciseSet): Promise<void>;
}
