import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { LessonId } from '../../../curriculum/index.js';
import type { Exercise, Hint, Solution } from '../entities/exercise-elements.js';
import {
  DuplicateExerciseElementError,
  ExerciseNotFoundError,
  ExerciseSetCapacityError,
  IncompleteExerciseSetError,
  InvalidExerciseDateError,
  InvalidExerciseProgressionError,
  InvalidExerciseSetStateError,
  type ExerciseError,
} from '../errors/exercise-errors.js';
import {
  ExerciseAdded,
  ExerciseSetCreated,
  ExerciseSetPublished,
  HintAdded,
  SolutionAdded,
} from '../events/exercise-events.js';
import type { ExerciseId, ExerciseSetId } from '../identifiers/exercise-identifiers.js';
import {
  DIFFICULTIES,
  EXERCISE_SET_SIZE,
  MAXIMUM_MULTIPLE_CHOICE_EXERCISES,
  type ExerciseSetStatus,
  type ExerciseType,
} from '../types/exercise-types.js';

export interface ExerciseTransition {
  readonly eventId: Uuid;
  readonly occurredAt: Date;
}
export interface ExerciseSetState {
  readonly aggregateVersion: number;
  readonly createdAt: Date;
  readonly exercises: readonly Exercise[];
  readonly id: ExerciseSetId;
  readonly lessonId: LessonId;
  readonly status: ExerciseSetStatus;
  readonly updatedAt: Date;
}

export class ExerciseSet extends AggregateRoot<ExerciseSetId> {
  readonly lessonId: LessonId;
  readonly #createdAtEpoch: number;
  #updatedAtEpoch: number;
  #aggregateVersion: number;
  #status: ExerciseSetStatus;
  #exercises: readonly Exercise[];

  private constructor(state: ExerciseSetState) {
    super(state.id);
    assertDate(state.createdAt, 'createdAt');
    assertDate(state.updatedAt, 'updatedAt');
    if (state.updatedAt.getTime() < state.createdAt.getTime())
      throw new InvalidExerciseDateError('updatedAt');
    if (!Number.isSafeInteger(state.aggregateVersion) || state.aggregateVersion < 1)
      throw new InvalidExerciseProgressionError('invalid-version');
    if (state.status !== 'draft' && state.status !== 'published')
      throw new InvalidExerciseSetStateError(state.status);
    validateCollection(state.exercises, state.status === 'published');
    this.lessonId = state.lessonId;
    this.#createdAtEpoch = state.createdAt.getTime();
    this.#updatedAtEpoch = state.updatedAt.getTime();
    this.#aggregateVersion = state.aggregateVersion;
    this.#status = state.status;
    this.#exercises = Object.freeze([...state.exercises]);
  }
  static create(state: {
    readonly createdAt: Date;
    readonly eventId: Uuid;
    readonly id: ExerciseSetId;
    readonly lessonId: LessonId;
  }): ExerciseSet {
    const set = new ExerciseSet({
      aggregateVersion: 1,
      createdAt: state.createdAt,
      exercises: [],
      id: state.id,
      lessonId: state.lessonId,
      status: 'draft',
      updatedAt: state.createdAt,
    });
    set.recordDomainEvent(
      new ExerciseSetCreated(
        set.envelope({ eventId: state.eventId, occurredAt: state.createdAt }),
        state.lessonId.toString(),
      ),
    );
    return set;
  }
  static rehydrate(state: ExerciseSetState): ExerciseSet {
    return new ExerciseSet(state);
  }
  get aggregateVersion(): number {
    return this.#aggregateVersion;
  }
  get createdAt(): Date {
    return new Date(this.#createdAtEpoch);
  }
  get updatedAt(): Date {
    return new Date(this.#updatedAtEpoch);
  }
  get status(): ExerciseSetStatus {
    return this.#status;
  }
  get exercises(): readonly Exercise[] {
    return this.#exercises;
  }

  addExercise(exercise: Exercise, transition: ExerciseTransition): ResultType<void, ExerciseError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    if (this.#exercises.length >= EXERCISE_SET_SIZE)
      return Result.failure(new ExerciseSetCapacityError());
    const conflict = findConflict(this.#exercises, exercise);
    if (conflict) return Result.failure(new DuplicateExerciseElementError('Exercise', conflict));
    if (exercise.order.value !== this.#exercises.length + 1)
      return Result.failure(new InvalidExerciseProgressionError('non-consecutive-order'));
    const previous = this.#exercises.at(-1);
    if (previous && difficultyRank(exercise) < difficultyRank(previous))
      return Result.failure(new InvalidExerciseProgressionError('difficulty-regression'));
    if (
      exercise.type === 'MultipleChoice' &&
      countType(this.#exercises, 'MultipleChoice') >= MAXIMUM_MULTIPLE_CHOICE_EXERCISES
    )
      return Result.failure(new InvalidExerciseProgressionError('multiple-choice-limit'));
    this.commit(transition);
    this.#exercises = Object.freeze([...this.#exercises, exercise]);
    this.recordDomainEvent(
      new ExerciseAdded(this.envelope(transition), exercise.id, exercise.order.value),
    );
    return Result.success(undefined);
  }
  addHint(
    exerciseId: ExerciseId,
    hint: Hint,
    transition: ExerciseTransition,
  ): ResultType<void, ExerciseError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const exercise = this.findExercise(exerciseId);
    if (!exercise) return Result.failure(new ExerciseNotFoundError());
    if (exercise.hints.some((item) => item.id.equals(hint.id)))
      return Result.failure(new DuplicateExerciseElementError('Hint', 'id'));
    if (exercise.hints.some((item) => item.text.canonicalValue === hint.text.canonicalValue))
      return Result.failure(new DuplicateExerciseElementError('Hint', 'text'));
    this.commit(transition);
    this.replace(exercise.withHint(hint));
    this.recordDomainEvent(new HintAdded(this.envelope(transition), exerciseId, hint.id));
    return Result.success(undefined);
  }
  addSolution(
    exerciseId: ExerciseId,
    solution: Solution,
    transition: ExerciseTransition,
  ): ResultType<void, ExerciseError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const exercise = this.findExercise(exerciseId);
    if (!exercise) return Result.failure(new ExerciseNotFoundError());
    if (exercise.solution)
      return Result.failure(new DuplicateExerciseElementError('Solution', 'exerciseId'));
    this.commit(transition);
    this.replace(exercise.withSolution(solution));
    this.recordDomainEvent(new SolutionAdded(this.envelope(transition), exerciseId, solution.id));
    return Result.success(undefined);
  }
  publish(transition: ExerciseTransition): ResultType<void, ExerciseError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const complete = publicationFailure(this.#exercises);
    if (complete) return Result.failure(new IncompleteExerciseSetError(complete));
    this.commit(transition);
    this.#status = 'published';
    this.recordDomainEvent(
      new ExerciseSetPublished(this.envelope(transition), this.lessonId.toString()),
    );
    return Result.success(undefined);
  }
  private findExercise(id: ExerciseId): Exercise | undefined {
    return this.#exercises.find((item) => item.id.equals(id));
  }
  private replace(exercise: Exercise): void {
    this.#exercises = Object.freeze(
      this.#exercises.map((item) => (item.id.equals(exercise.id) ? exercise : item)),
    );
  }
  private ensureEditable(): ResultType<void, InvalidExerciseSetStateError> {
    return this.#status === 'draft'
      ? Result.success(undefined)
      : Result.failure(new InvalidExerciseSetStateError(this.#status));
  }
  private commit(transition: ExerciseTransition): void {
    assertDate(transition.occurredAt, 'occurredAt');
    if (transition.occurredAt.getTime() < this.#updatedAtEpoch)
      throw new InvalidExerciseDateError('occurredAt');
    this.#updatedAtEpoch = transition.occurredAt.getTime();
    this.#aggregateVersion += 1;
  }
  private envelope(transition: ExerciseTransition) {
    return {
      aggregateId: this.id,
      aggregateVersion: this.#aggregateVersion,
      eventId: transition.eventId,
      occurredAt: transition.occurredAt,
    };
  }
}

function publicationFailure(items: readonly Exercise[]): string | undefined {
  if (items.length !== EXERCISE_SET_SIZE) return 'exercise-count';
  if (items.some((item) => item.hints.length === 0)) return 'missing-hint';
  if (items.some((item) => !item.solution)) return 'missing-solution';
  const coding = countType(items, 'Coding');
  const competitors = new Map<ExerciseType, number>();
  for (const item of items)
    if (item.type !== 'Coding') competitors.set(item.type, (competitors.get(item.type) ?? 0) + 1);
  if ([...competitors.values()].some((count) => count >= coding)) return 'coding-not-predominant';
  return undefined;
}
function validateCollection(items: readonly Exercise[], published: boolean): void {
  if (items.length > EXERCISE_SET_SIZE) throw new ExerciseSetCapacityError();
  items.forEach((item, index) => {
    if (item.order.value !== index + 1)
      throw new InvalidExerciseProgressionError('non-consecutive-order');
    const conflict = findConflict(items.slice(0, index), item);
    if (conflict) throw new DuplicateExerciseElementError('Exercise', conflict);
    if (index > 0 && difficultyRank(item) < difficultyRank(items[index - 1]!))
      throw new InvalidExerciseProgressionError('difficulty-regression');
  });
  if (countType(items, 'MultipleChoice') > MAXIMUM_MULTIPLE_CHOICE_EXERCISES)
    throw new InvalidExerciseProgressionError('multiple-choice-limit');
  if (published) {
    const reason = publicationFailure(items);
    if (reason) throw new IncompleteExerciseSetError(reason);
  }
}
function findConflict(
  items: readonly Exercise[],
  item: Exercise,
): 'id' | 'title' | 'statement' | 'order' | undefined {
  for (const current of items) {
    if (current.id.equals(item.id)) return 'id';
    if (current.title.canonicalValue === item.title.canonicalValue) return 'title';
    if (current.statement.canonicalValue === item.statement.canonicalValue) return 'statement';
    if (current.order.value === item.order.value) return 'order';
  }
  return undefined;
}
function difficultyRank(exercise: Exercise): number {
  return DIFFICULTIES.indexOf(exercise.difficulty.value);
}
function countType(items: readonly Exercise[], type: ExerciseType): number {
  return items.filter((item) => item.type === type).length;
}
function assertDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) throw new InvalidExerciseDateError(field);
}
