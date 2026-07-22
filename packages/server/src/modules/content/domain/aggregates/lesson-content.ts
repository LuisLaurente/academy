import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import { Entity } from '../../../../domain/entities/entity.js';
import type { LessonId } from '../../../curriculum/index.js';
import {
  DuplicateContentElementError,
  IncompleteLessonContentError,
  InvalidContentDateError,
  InvalidContentMetadataError,
  InvalidContentStateError,
  InvalidContentVersionError,
  type ContentError,
} from '../errors/content-errors.js';
import {
  ExampleAdded,
  KeyConceptAdded,
  LessonContentCreated,
  LessonContentPublished,
  SummaryUpdated,
  TheoryUpdated,
} from '../events/content-events.js';
import type {
  ContentId,
  ExampleId,
  SummaryId,
  TheoryId,
} from '../identifiers/content-identifiers.js';
import type {
  CommonMistakeText,
  ConnectionText,
  DisplayOrder,
  ExampleCode,
  ExampleExplanation,
  ExampleTitle,
  KeyConceptName,
  SummaryText,
  TheoryText,
} from '../value-objects/content-value-objects.js';

export type ContentStatus = 'draft' | 'published';
export type GeneratorType = 'Manual' | 'Gemini' | 'FutureLLM';
export type ContentDifficulty = 1 | 2 | 3 | 4 | 5;

export class Theory extends Entity<TheoryId> {
  readonly text: TheoryText;
  private constructor(id: TheoryId, text: TheoryText) {
    super(id);
    this.text = text;
    Object.freeze(this);
  }
  static create(id: TheoryId, text: TheoryText): Theory {
    return new Theory(id, text);
  }
  withText(text: TheoryText): Theory {
    return new Theory(this.id, text);
  }
}

export class Summary extends Entity<SummaryId> {
  readonly text: SummaryText;
  private constructor(id: SummaryId, text: SummaryText) {
    super(id);
    this.text = text;
    Object.freeze(this);
  }
  static create(id: SummaryId, text: SummaryText): Summary {
    return new Summary(id, text);
  }
  withText(text: SummaryText): Summary {
    return new Summary(this.id, text);
  }
}

interface ExampleState {
  readonly code: ExampleCode;
  readonly explanation: ExampleExplanation;
  readonly id: ExampleId;
  readonly order: DisplayOrder;
  readonly title: ExampleTitle;
}
export class Example extends Entity<ExampleId> {
  readonly code: ExampleCode;
  readonly explanation: ExampleExplanation;
  readonly order: DisplayOrder;
  readonly title: ExampleTitle;
  private constructor(state: ExampleState) {
    super(state.id);
    this.code = state.code;
    this.explanation = state.explanation;
    this.order = state.order;
    this.title = state.title;
    Object.freeze(this);
  }
  static create(state: ExampleState): Example {
    return new Example(state);
  }
}

export class KeyConcept {
  readonly name: KeyConceptName;
  readonly order: DisplayOrder;
  private constructor(name: KeyConceptName, order: DisplayOrder) {
    this.name = name;
    this.order = order;
    Object.freeze(this);
  }
  static create(name: KeyConceptName, order: DisplayOrder): KeyConcept {
    return new KeyConcept(name, order);
  }
}

export interface MetadataState {
  readonly difficulty: number;
  readonly estimatedReadingMinutes: number;
  readonly generator: GeneratorType;
  readonly language: string;
  readonly version: number;
}
export class Metadata {
  readonly difficulty: ContentDifficulty;
  readonly estimatedReadingMinutes: number;
  readonly generator: GeneratorType;
  readonly language: string;
  readonly version: number;
  private constructor(state: MetadataState) {
    this.difficulty = state.difficulty as ContentDifficulty;
    this.estimatedReadingMinutes = state.estimatedReadingMinutes;
    this.generator = state.generator;
    this.language = state.language;
    this.version = state.version;
    Object.freeze(this);
  }
  static create(state: MetadataState): ResultType<Metadata, InvalidContentMetadataError> {
    if (!Number.isInteger(state.difficulty) || state.difficulty < 1 || state.difficulty > 5)
      return Result.failure(new InvalidContentMetadataError('difficulty'));
    if (
      !Number.isSafeInteger(state.estimatedReadingMinutes) ||
      state.estimatedReadingMinutes < 1 ||
      state.estimatedReadingMinutes > 1_440
    )
      return Result.failure(new InvalidContentMetadataError('estimatedReadingMinutes'));
    if (state.generator !== 'Manual')
      return Result.failure(new InvalidContentMetadataError('generator'));
    const language = state.language.trim();
    if (language.length > 35 || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u.test(language))
      return Result.failure(new InvalidContentMetadataError('language'));
    if (!Number.isSafeInteger(state.version) || state.version < 1)
      return Result.failure(new InvalidContentMetadataError('version'));
    return Result.success(new Metadata({ ...state, language }));
  }
}

export interface ContentTransition {
  readonly eventId: Uuid;
  readonly occurredAt: Date;
}
export interface LessonContentState {
  readonly aggregateVersion: number;
  readonly commonMistakes?: readonly CommonMistakeText[];
  readonly connectionWithPreviousLesson: ConnectionText;
  readonly createdAt: Date;
  readonly examples: readonly Example[];
  readonly id: ContentId;
  readonly keyConcepts: readonly KeyConcept[];
  readonly lessonId: LessonId;
  readonly metadata: Metadata;
  readonly status: ContentStatus;
  readonly summary: Summary;
  readonly theory: Theory;
  readonly updatedAt: Date;
}

type ContentMutationError = ContentError;

export class LessonContent extends AggregateRoot<ContentId> {
  readonly lessonId: LessonId;
  readonly connectionWithPreviousLesson: ConnectionText;
  readonly metadata: Metadata;
  #theory: Theory;
  #summary: Summary;
  #status: ContentStatus;
  #aggregateVersion: number;
  #updatedAtEpoch: number;
  readonly #createdAtEpoch: number;
  #keyConcepts: readonly KeyConcept[];
  #examples: readonly Example[];
  readonly #commonMistakes: readonly CommonMistakeText[];

  private constructor(state: LessonContentState) {
    super(state.id);
    assertDate(state.createdAt, 'createdAt');
    assertDate(state.updatedAt, 'updatedAt');
    if (state.updatedAt.getTime() < state.createdAt.getTime())
      throw new InvalidContentDateError('updatedAt');
    if (!Number.isSafeInteger(state.aggregateVersion) || state.aggregateVersion < 1)
      throw new InvalidContentVersionError('aggregateVersion');
    if (state.status !== 'draft' && state.status !== 'published')
      throw new InvalidContentStateError(state.status);
    ensureComplete(state.keyConcepts, state.examples);
    ensureUniqueKeyConcepts(state.keyConcepts);
    ensureUniqueExamples(state.examples);
    ensureUniqueMistakes(state.commonMistakes ?? []);
    this.lessonId = state.lessonId;
    this.connectionWithPreviousLesson = state.connectionWithPreviousLesson;
    this.metadata = state.metadata;
    this.#theory = state.theory;
    this.#summary = state.summary;
    this.#status = state.status;
    this.#aggregateVersion = state.aggregateVersion;
    this.#createdAtEpoch = state.createdAt.getTime();
    this.#updatedAtEpoch = state.updatedAt.getTime();
    this.#keyConcepts = Object.freeze(sortByOrder(state.keyConcepts));
    this.#examples = Object.freeze(sortByOrder(state.examples));
    this.#commonMistakes = Object.freeze([...(state.commonMistakes ?? [])]);
  }

  static create(
    state: Omit<LessonContentState, 'aggregateVersion' | 'status'> & { readonly eventId: Uuid },
  ): LessonContent {
    const content = new LessonContent({ ...state, aggregateVersion: 1, status: 'draft' });
    content.recordDomainEvent(
      new LessonContentCreated(
        content.envelope({ eventId: state.eventId, occurredAt: state.createdAt }),
        state.lessonId.toString(),
      ),
    );
    return content;
  }
  static rehydrate(state: LessonContentState): LessonContent {
    return new LessonContent(state);
  }
  get status(): ContentStatus {
    return this.#status;
  }
  get theory(): Theory {
    return this.#theory;
  }
  get summary(): Summary {
    return this.#summary;
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
  get keyConcepts(): readonly KeyConcept[] {
    return this.#keyConcepts;
  }
  get examples(): readonly Example[] {
    return this.#examples;
  }
  get commonMistakes(): readonly CommonMistakeText[] {
    return this.#commonMistakes;
  }

  updateTheory(
    text: TheoryText,
    transition: ContentTransition,
  ): ResultType<void, ContentMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    if (this.#theory.text.equals(text))
      return Result.failure(new DuplicateContentElementError('Theory', 'text'));
    this.commit(transition);
    this.#theory = this.#theory.withText(text);
    this.recordDomainEvent(new TheoryUpdated(this.envelope(transition), this.#theory.id));
    return Result.success(undefined);
  }
  addKeyConcept(
    concept: KeyConcept,
    transition: ContentTransition,
  ): ResultType<void, ContentMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const duplicate = this.#keyConcepts.find(
      (item) =>
        item.name.canonicalValue === concept.name.canonicalValue ||
        item.order.value === concept.order.value,
    );
    if (duplicate !== undefined)
      return Result.failure(
        new DuplicateContentElementError(
          'KeyConcept',
          duplicate.name.canonicalValue === concept.name.canonicalValue ? 'name' : 'order',
        ),
      );
    this.commit(transition);
    this.#keyConcepts = Object.freeze(sortByOrder([...this.#keyConcepts, concept]));
    this.recordDomainEvent(
      new KeyConceptAdded(this.envelope(transition), concept.name.value, concept.order.value),
    );
    return Result.success(undefined);
  }
  addExample(
    example: Example,
    transition: ContentTransition,
  ): ResultType<void, ContentMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    const conflict = findExampleConflict(this.#examples, example);
    if (conflict !== undefined)
      return Result.failure(new DuplicateContentElementError('Example', conflict));
    this.commit(transition);
    this.#examples = Object.freeze(sortByOrder([...this.#examples, example]));
    this.recordDomainEvent(new ExampleAdded(this.envelope(transition), example.id));
    return Result.success(undefined);
  }
  updateSummary(
    text: SummaryText,
    transition: ContentTransition,
  ): ResultType<void, ContentMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    if (this.#summary.text.equals(text))
      return Result.failure(new DuplicateContentElementError('Summary', 'text'));
    this.commit(transition);
    this.#summary = this.#summary.withText(text);
    this.recordDomainEvent(new SummaryUpdated(this.envelope(transition), this.#summary.id));
    return Result.success(undefined);
  }
  publish(transition: ContentTransition): ResultType<void, ContentMutationError> {
    const editable = this.ensureEditable();
    if (!editable.isSuccess) return editable;
    ensureComplete(this.#keyConcepts, this.#examples);
    this.commit(transition);
    this.#status = 'published';
    this.recordDomainEvent(
      new LessonContentPublished(this.envelope(transition), this.lessonId.toString()),
    );
    return Result.success(undefined);
  }
  private ensureEditable(): ResultType<void, InvalidContentStateError> {
    return this.#status === 'draft'
      ? Result.success(undefined)
      : Result.failure(new InvalidContentStateError(this.#status));
  }
  private commit(transition: ContentTransition): void {
    assertDate(transition.occurredAt, 'occurredAt');
    if (transition.occurredAt.getTime() < this.#updatedAtEpoch)
      throw new InvalidContentDateError('occurredAt');
    this.#updatedAtEpoch = transition.occurredAt.getTime();
    this.#aggregateVersion += 1;
  }
  private envelope(transition: ContentTransition): {
    aggregateId: ContentId;
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
}

function ensureComplete(keyConcepts: readonly KeyConcept[], examples: readonly Example[]): void {
  if (keyConcepts.length === 0) throw new IncompleteLessonContentError('missing-key-concept');
  if (examples.length === 0) throw new IncompleteLessonContentError('missing-example');
}
function sortByOrder<T extends { readonly order: DisplayOrder }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.order.value - right.order.value);
}
function ensureUniqueKeyConcepts(items: readonly KeyConcept[]): void {
  for (const [index, item] of items.entries()) {
    const prior = items.slice(0, index);
    if (prior.some((value) => value.name.canonicalValue === item.name.canonicalValue))
      throw new DuplicateContentElementError('KeyConcept', 'name');
    if (prior.some((value) => value.order.value === item.order.value))
      throw new DuplicateContentElementError('KeyConcept', 'order');
  }
}
function findExampleConflict(
  items: readonly Example[],
  item: Example,
): 'id' | 'order' | 'title' | undefined {
  for (const value of items) {
    if (value.id.equals(item.id)) return 'id';
    if (value.order.value === item.order.value) return 'order';
    if (value.title.canonicalValue === item.title.canonicalValue) return 'title';
  }
  return undefined;
}
function ensureUniqueExamples(items: readonly Example[]): void {
  for (const [index, item] of items.entries()) {
    const conflict = findExampleConflict(items.slice(0, index), item);
    if (conflict !== undefined) throw new DuplicateContentElementError('Example', conflict);
  }
}
function ensureUniqueMistakes(items: readonly CommonMistakeText[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.canonicalValue))
      throw new DuplicateContentElementError('CommonMistake', 'text');
    seen.add(item.canonicalValue);
  }
}
function assertDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) throw new InvalidContentDateError(field);
}
