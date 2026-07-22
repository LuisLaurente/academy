import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import { Entity } from '../../../../domain/entities/entity.js';
import {
  CurriculumElementNotFoundError,
  DuplicateCurriculumElementError,
  IncompleteCurriculumHierarchyError,
  InvalidCurriculumDateError,
  InvalidCurriculumStateError,
  InvalidCurriculumTextError,
} from '../errors/curriculum-errors.js';
import {
  ConceptAdded,
  LessonAdded,
  LevelAdded,
  SublevelAdded,
  TopicCreated,
} from '../events/curriculum-events.js';
import {
  type ConceptId,
  type LessonId,
  type LevelId,
  type SublevelId,
  type TopicId,
} from '../identifiers/curriculum-identifiers.js';
import {
  canonicalizeCurriculumLabel,
  type ConceptName,
  type DifficultyLevel,
  type LearningOrder,
  type LessonTitle,
  normalizeCurriculumLabel,
  type TopicDescription,
  type TopicName,
} from '../value-objects/curriculum-value-objects.js';

export type TopicStatus = 'active' | 'archived' | 'draft';

interface ConceptState {
  readonly difficulty: DifficultyLevel;
  readonly id: ConceptId;
  readonly name: ConceptName;
  readonly order: LearningOrder;
}

export class Concept extends Entity<ConceptId> {
  readonly difficulty: DifficultyLevel;
  readonly name: ConceptName;
  readonly order: LearningOrder;

  private constructor(state: ConceptState) {
    super(state.id);
    this.difficulty = state.difficulty;
    this.name = state.name;
    this.order = state.order;
    Object.freeze(this);
  }

  static create(state: ConceptState): Concept {
    return new Concept(state);
  }
}

interface LessonState {
  readonly concepts?: readonly Concept[];
  readonly id: LessonId;
  readonly order: LearningOrder;
  readonly title: LessonTitle;
}

type AddChildError = DuplicateCurriculumElementError;

export class Lesson extends Entity<LessonId> {
  readonly order: LearningOrder;
  readonly title: LessonTitle;
  readonly #concepts: readonly Concept[];

  private constructor(state: LessonState) {
    super(state.id);
    ensureUniqueChildren(state.concepts ?? [], 'Concept', (concept) => ({
      canonicalName: concept.name.canonicalValue,
      id: concept.id.toString(),
      order: concept.order.value,
    }));
    this.order = state.order;
    this.title = state.title;
    this.#concepts = Object.freeze(sortByOrder(state.concepts ?? []));
    Object.freeze(this);
  }

  static create(state: LessonState): Lesson {
    return new Lesson(state);
  }

  get concepts(): readonly Concept[] {
    return this.#concepts;
  }

  withConcept(concept: Concept): ResultType<Lesson, AddChildError> {
    const duplicate = findDuplicate(this.#concepts, concept, (item) => ({
      canonicalName: item.name.canonicalValue,
      id: item.id.toString(),
      order: item.order.value,
    }));
    return duplicate === undefined
      ? Result.success(new Lesson({ ...this.toState(), concepts: [...this.#concepts, concept] }))
      : Result.failure(new DuplicateCurriculumElementError('Concept', duplicate));
  }

  private toState(): LessonState {
    return { concepts: this.#concepts, id: this.id, order: this.order, title: this.title };
  }
}

interface SublevelState {
  readonly difficulty: DifficultyLevel;
  readonly id: SublevelId;
  readonly lessons?: readonly Lesson[];
  readonly name: string;
  readonly order: LearningOrder;
}

export class Sublevel extends Entity<SublevelId> {
  readonly difficulty: DifficultyLevel;
  readonly name: string;
  readonly order: LearningOrder;
  readonly #lessons: readonly Lesson[];

  private constructor(state: SublevelState) {
    super(state.id);
    this.name = validateNodeName(state.name, 'sublevelName');
    ensureUniqueChildren(state.lessons ?? [], 'Lesson', (lesson) => ({
      canonicalName: lesson.title.canonicalValue,
      id: lesson.id.toString(),
      order: lesson.order.value,
    }));
    this.difficulty = state.difficulty;
    this.order = state.order;
    this.#lessons = Object.freeze(sortByOrder(state.lessons ?? []));
    Object.freeze(this);
  }

  static create(state: SublevelState): ResultType<Sublevel, InvalidCurriculumTextError> {
    try {
      return Result.success(new Sublevel(state));
    } catch (error) {
      if (error instanceof InvalidCurriculumTextError) return Result.failure(error);
      throw error;
    }
  }

  get lessons(): readonly Lesson[] {
    return this.#lessons;
  }

  findLesson(lessonId: LessonId): Lesson | undefined {
    return this.#lessons.find((lesson) => lesson.id.equals(lessonId));
  }

  withLesson(lesson: Lesson): ResultType<Sublevel, AddChildError> {
    const duplicate = findDuplicate(this.#lessons, lesson, (item) => ({
      canonicalName: item.title.canonicalValue,
      id: item.id.toString(),
      order: item.order.value,
    }));
    return duplicate === undefined
      ? Result.success(new Sublevel({ ...this.toState(), lessons: [...this.#lessons, lesson] }))
      : Result.failure(new DuplicateCurriculumElementError('Lesson', duplicate));
  }

  replaceLesson(lesson: Lesson): Sublevel {
    return new Sublevel({
      ...this.toState(),
      lessons: this.#lessons.map((current) => (current.id.equals(lesson.id) ? lesson : current)),
    });
  }

  private toState(): SublevelState {
    return {
      difficulty: this.difficulty,
      id: this.id,
      lessons: this.#lessons,
      name: this.name,
      order: this.order,
    };
  }
}

interface LevelState {
  readonly difficulty: DifficultyLevel;
  readonly id: LevelId;
  readonly name: string;
  readonly order: LearningOrder;
  readonly sublevels?: readonly Sublevel[];
}

export class Level extends Entity<LevelId> {
  readonly difficulty: DifficultyLevel;
  readonly name: string;
  readonly order: LearningOrder;
  readonly #sublevels: readonly Sublevel[];

  private constructor(state: LevelState) {
    super(state.id);
    this.name = validateNodeName(state.name, 'levelName');
    ensureUniqueChildren(state.sublevels ?? [], 'Sublevel', (sublevel) => ({
      canonicalName: canonicalizeCurriculumLabel(sublevel.name),
      id: sublevel.id.toString(),
      order: sublevel.order.value,
    }));
    this.difficulty = state.difficulty;
    this.order = state.order;
    this.#sublevels = Object.freeze(sortByOrder(state.sublevels ?? []));
    Object.freeze(this);
  }

  static create(state: LevelState): ResultType<Level, InvalidCurriculumTextError> {
    try {
      return Result.success(new Level(state));
    } catch (error) {
      if (error instanceof InvalidCurriculumTextError) return Result.failure(error);
      throw error;
    }
  }

  get sublevels(): readonly Sublevel[] {
    return this.#sublevels;
  }

  findSublevel(sublevelId: SublevelId): Sublevel | undefined {
    return this.#sublevels.find((sublevel) => sublevel.id.equals(sublevelId));
  }

  withSublevel(sublevel: Sublevel): ResultType<Level, AddChildError> {
    const duplicate = findDuplicate(this.#sublevels, sublevel, (item) => ({
      canonicalName: canonicalizeCurriculumLabel(item.name),
      id: item.id.toString(),
      order: item.order.value,
    }));
    return duplicate === undefined
      ? Result.success(new Level({ ...this.toState(), sublevels: [...this.#sublevels, sublevel] }))
      : Result.failure(new DuplicateCurriculumElementError('Sublevel', duplicate));
  }

  replaceSublevel(sublevel: Sublevel): Level {
    return new Level({
      ...this.toState(),
      sublevels: this.#sublevels.map((current) =>
        current.id.equals(sublevel.id) ? sublevel : current,
      ),
    });
  }

  private toState(): LevelState {
    return {
      difficulty: this.difficulty,
      id: this.id,
      name: this.name,
      order: this.order,
      sublevels: this.#sublevels,
    };
  }
}

interface TopicState {
  readonly aggregateVersion: number;
  readonly createdAt: Date;
  readonly description: TopicDescription;
  readonly id: TopicId;
  readonly levels?: readonly Level[];
  readonly name: TopicName;
  readonly status: TopicStatus;
  readonly updatedAt: Date;
}

interface CreateTopicState extends Omit<TopicState, 'aggregateVersion' | 'levels' | 'status'> {
  readonly eventId: Uuid;
}

interface TopicTransition {
  readonly eventId: Uuid;
  readonly occurredAt: Date;
}

type TopicMutationError =
  CurriculumElementNotFoundError | DuplicateCurriculumElementError | InvalidCurriculumStateError;

export class Topic extends AggregateRoot<TopicId> {
  readonly description: TopicDescription;
  readonly name: TopicName;
  readonly status: TopicStatus;

  #aggregateVersion: number;
  #levels: readonly Level[];
  #updatedAtEpochMilliseconds: number;
  readonly #createdAtEpochMilliseconds: number;

  private constructor(state: TopicState) {
    super(state.id);
    assertDate(state.createdAt, 'createdAt');
    assertDate(state.updatedAt, 'updatedAt');
    if (state.updatedAt.getTime() < state.createdAt.getTime()) {
      throw new InvalidCurriculumDateError('updatedAt');
    }
    if (!Number.isSafeInteger(state.aggregateVersion) || state.aggregateVersion < 1) {
      throw new RangeError('Topic aggregate version must be a positive safe integer.');
    }
    ensureUniqueChildren(state.levels ?? [], 'Level', (level) => ({
      canonicalName: canonicalizeCurriculumLabel(level.name),
      id: level.id.toString(),
      order: level.order.value,
    }));

    this.description = state.description;
    this.name = state.name;
    this.status = state.status;
    this.#aggregateVersion = state.aggregateVersion;
    this.#levels = Object.freeze(sortByOrder(state.levels ?? []));
    this.#createdAtEpochMilliseconds = state.createdAt.getTime();
    this.#updatedAtEpochMilliseconds = state.updatedAt.getTime();

    if (state.status === 'active') {
      const structure = this.validateStructure();
      if (!structure.isSuccess) throw structure.error;
    }
  }

  static create(state: CreateTopicState): Topic {
    const topic = new Topic({ ...state, aggregateVersion: 1, levels: [], status: 'draft' });
    topic.recordDomainEvent(
      new TopicCreated({
        aggregateId: topic.id,
        aggregateVersion: topic.#aggregateVersion,
        eventId: state.eventId,
        occurredAt: state.createdAt,
      }),
    );
    return topic;
  }

  static rehydrate(state: TopicState): Topic {
    return new Topic(state);
  }

  get aggregateVersion(): number {
    return this.#aggregateVersion;
  }

  get createdAt(): Date {
    return new Date(this.#createdAtEpochMilliseconds);
  }

  get levels(): readonly Level[] {
    return this.#levels;
  }

  get updatedAt(): Date {
    return new Date(this.#updatedAtEpochMilliseconds);
  }

  findLevel(levelId: LevelId): Level | undefined {
    return this.#levels.find((level) => level.id.equals(levelId));
  }

  addLevel(level: Level, transition: TopicTransition): ResultType<void, TopicMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const duplicate = findDuplicate(this.#levels, level, (item) => ({
      canonicalName: canonicalizeCurriculumLabel(item.name),
      id: item.id.toString(),
      order: item.order.value,
    }));
    if (duplicate !== undefined) {
      return Result.failure(new DuplicateCurriculumElementError('Level', duplicate));
    }

    this.#levels = Object.freeze(sortByOrder([...this.#levels, level]));
    this.commitTransition(transition);
    this.recordDomainEvent(new LevelAdded(this.eventEnvelope(transition), level.id));
    return Result.success(undefined);
  }

  addSublevel(
    levelId: LevelId,
    sublevel: Sublevel,
    transition: TopicTransition,
  ): ResultType<void, TopicMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const level = this.findLevel(levelId);
    if (level === undefined) {
      return Result.failure(new CurriculumElementNotFoundError('Level'));
    }
    if (this.containsSublevelId(sublevel.id)) {
      return Result.failure(new DuplicateCurriculumElementError('Sublevel', 'id'));
    }
    const addition = level.withSublevel(sublevel);
    if (!addition.isSuccess) return addition;

    this.replaceLevel(addition.value);
    this.commitTransition(transition);
    this.recordDomainEvent(new SublevelAdded(this.eventEnvelope(transition), levelId, sublevel.id));
    return Result.success(undefined);
  }

  addLesson(
    sublevelId: SublevelId,
    lesson: Lesson,
    transition: TopicTransition,
  ): ResultType<void, TopicMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const location = this.findSublevelLocation(sublevelId);
    if (location === undefined) {
      return Result.failure(new CurriculumElementNotFoundError('Sublevel'));
    }
    if (this.containsLessonId(lesson.id)) {
      return Result.failure(new DuplicateCurriculumElementError('Lesson', 'id'));
    }
    const addition = location.sublevel.withLesson(lesson);
    if (!addition.isSuccess) return addition;

    this.replaceLevel(location.level.replaceSublevel(addition.value));
    this.commitTransition(transition);
    this.recordDomainEvent(
      new LessonAdded(this.eventEnvelope(transition), location.level.id, sublevelId, lesson.id),
    );
    return Result.success(undefined);
  }

  addConcept(
    lessonId: LessonId,
    concept: Concept,
    transition: TopicTransition,
  ): ResultType<void, TopicMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const location = this.findLessonLocation(lessonId);
    if (location === undefined) {
      return Result.failure(new CurriculumElementNotFoundError('Lesson'));
    }
    if (this.containsConceptId(concept.id)) {
      return Result.failure(new DuplicateCurriculumElementError('Concept', 'id'));
    }
    if (this.containsConceptName(concept.name.canonicalValue)) {
      return Result.failure(new DuplicateCurriculumElementError('Concept', 'name'));
    }
    const addition = location.lesson.withConcept(concept);
    if (!addition.isSuccess) return addition;

    const updatedSublevel = location.sublevel.replaceLesson(addition.value);
    this.replaceLevel(location.level.replaceSublevel(updatedSublevel));
    this.commitTransition(transition);
    this.recordDomainEvent(new ConceptAdded(this.eventEnvelope(transition), lessonId, concept.id));
    return Result.success(undefined);
  }

  validateStructure(): ResultType<void, IncompleteCurriculumHierarchyError> {
    if (this.#levels.length === 0) {
      return incomplete('topic-has-no-levels');
    }
    if (!hasContiguousOrder(this.#levels)) {
      return incomplete('level-order-is-not-contiguous');
    }
    for (const level of this.#levels) {
      if (level.sublevels.length === 0) return incomplete('level-has-no-sublevels');
      if (!hasContiguousOrder(level.sublevels))
        return incomplete('sublevel-order-is-not-contiguous');
      for (const sublevel of level.sublevels) {
        if (sublevel.lessons.length === 0) return incomplete('sublevel-has-no-lessons');
        if (!hasContiguousOrder(sublevel.lessons))
          return incomplete('lesson-order-is-not-contiguous');
        for (const lesson of sublevel.lessons) {
          if (lesson.concepts.length === 0) return incomplete('lesson-has-no-concepts');
          if (!hasContiguousOrder(lesson.concepts)) {
            return incomplete('concept-order-is-not-contiguous');
          }
        }
      }
    }
    return Result.success(undefined);
  }

  private ensureEditable(): ResultType<void, InvalidCurriculumStateError> {
    return this.status === 'draft'
      ? Result.success(undefined)
      : Result.failure(new InvalidCurriculumStateError(this.status));
  }

  private commitTransition(transition: TopicTransition): void {
    assertDate(transition.occurredAt, 'occurredAt');
    if (transition.occurredAt.getTime() < this.#updatedAtEpochMilliseconds) {
      throw new InvalidCurriculumDateError('occurredAt');
    }
    this.#updatedAtEpochMilliseconds = transition.occurredAt.getTime();
    this.#aggregateVersion += 1;
  }

  private eventEnvelope(transition: TopicTransition): {
    aggregateId: TopicId;
    aggregateVersion: number;
    eventId: Uuid;
    occurredAt: Date;
  } {
    return {
      aggregateId: this.id,
      aggregateVersion: this.#aggregateVersion,
      eventId: transition.eventId,
      occurredAt: transition.occurredAt,
    };
  }

  private replaceLevel(level: Level): void {
    this.#levels = Object.freeze(
      this.#levels.map((current) => (current.id.equals(level.id) ? level : current)),
    );
  }

  private containsSublevelId(id: SublevelId): boolean {
    return this.#levels.some((level) => level.sublevels.some((item) => item.id.equals(id)));
  }

  private containsLessonId(id: LessonId): boolean {
    return this.#levels.some((level) =>
      level.sublevels.some((sublevel) => sublevel.lessons.some((item) => item.id.equals(id))),
    );
  }

  private containsConceptId(id: ConceptId): boolean {
    return this.#levels.some((level) =>
      level.sublevels.some((sublevel) =>
        sublevel.lessons.some((lesson) => lesson.concepts.some((item) => item.id.equals(id))),
      ),
    );
  }

  private containsConceptName(canonicalName: string): boolean {
    return this.#levels.some((level) =>
      level.sublevels.some((sublevel) =>
        sublevel.lessons.some((lesson) =>
          lesson.concepts.some((item) => item.name.canonicalValue === canonicalName),
        ),
      ),
    );
  }

  private findSublevelLocation(
    id: SublevelId,
  ): { readonly level: Level; readonly sublevel: Sublevel } | undefined {
    for (const level of this.#levels) {
      const sublevel = level.findSublevel(id);
      if (sublevel !== undefined) return { level, sublevel };
    }
    return undefined;
  }

  private findLessonLocation(
    id: LessonId,
  ): { readonly lesson: Lesson; readonly level: Level; readonly sublevel: Sublevel } | undefined {
    for (const level of this.#levels) {
      for (const sublevel of level.sublevels) {
        const lesson = sublevel.findLesson(id);
        if (lesson !== undefined) return { lesson, level, sublevel };
      }
    }
    return undefined;
  }
}

interface ChildIdentity {
  readonly canonicalName: string;
  readonly id: string;
  readonly order: number;
}

function findDuplicate<T>(
  existing: readonly T[],
  candidate: T,
  identity: (value: T) => ChildIdentity,
): 'id' | 'name' | 'order' | undefined {
  const candidateIdentity = identity(candidate);
  for (const current of existing) {
    const currentIdentity = identity(current);
    if (currentIdentity.id === candidateIdentity.id) return 'id';
    if (currentIdentity.canonicalName === candidateIdentity.canonicalName) return 'name';
    if (currentIdentity.order === candidateIdentity.order) return 'order';
  }
  return undefined;
}

function ensureUniqueChildren<T>(
  children: readonly T[],
  elementType: string,
  identity: (value: T) => ChildIdentity,
): void {
  for (const [index, child] of children.entries()) {
    const duplicate = findDuplicate(children.slice(0, index), child, identity);
    if (duplicate !== undefined) {
      throw new DuplicateCurriculumElementError(elementType, duplicate);
    }
  }
}

function sortByOrder<T extends { readonly order: LearningOrder }>(values: readonly T[]): T[] {
  return [...values].sort((left, right) => left.order.value - right.order.value);
}

function hasContiguousOrder(values: readonly { readonly order: LearningOrder }[]): boolean {
  return values.every((value, index) => value.order.value === index + 1);
}

function validateNodeName(candidate: string, field: string): string {
  const normalized = normalizeCurriculumLabel(candidate);
  if (normalized.length < 2 || normalized.length > 120) {
    throw new InvalidCurriculumTextError(field, 2, 120);
  }
  return normalized;
}

function assertDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new InvalidCurriculumDateError(field);
  }
}

function incomplete(reason: string): ResultType<void, IncompleteCurriculumHierarchyError> {
  return Result.failure(new IncompleteCurriculumHierarchyError(reason));
}
