import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type { LessonId } from '../../../curriculum/index.js';
import type { ExerciseSetRepository } from '../../application/ports/exercise-set-repository.js';
import type { ExerciseSet } from '../../domain/aggregates/exercise-set.js';
import type { ExerciseSetId } from '../../domain/identifiers/exercise-identifiers.js';

export class InMemoryExerciseSetRepository implements ExerciseSetRepository {
  readonly #sets = new Map<string, ExerciseSet>();
  readonly #byLesson = new Map<string, string>();
  findById(id: ExerciseSetId): Promise<ExerciseSet | undefined> {
    return Promise.resolve(this.#sets.get(id.toString()));
  }
  findByLessonId(lessonId: LessonId): Promise<ExerciseSet | undefined> {
    const id = this.#byLesson.get(lessonId.toString());
    return Promise.resolve(id ? this.#sets.get(id) : undefined);
  }
  save(exerciseSet: ExerciseSet): Promise<void> {
    this.#sets.set(exerciseSet.id.toString(), exerciseSet);
    this.#byLesson.set(exerciseSet.lessonId.toString(), exerciseSet.id.toString());
    return Promise.resolve();
  }
  get size(): number {
    return this.#sets.size;
  }
}
export class InMemoryExercisesUnitOfWork implements UnitOfWork {
  #pending: Promise<void> = Promise.resolve();
  execute<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    const execution = this.#pending.then(work, work);
    this.#pending = execution.then(
      () => undefined,
      () => undefined,
    );
    return execution;
  }
}
