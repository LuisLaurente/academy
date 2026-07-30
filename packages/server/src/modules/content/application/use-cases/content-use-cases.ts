import type { UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Clock } from '../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import {
  Example,
  KeyConcept,
  LessonContent,
  Metadata,
  Summary,
  Theory,
} from '../../domain/aggregates/lesson-content.js';
import {
  DuplicateContentElementError,
  IncompleteLessonContentError,
  LessonContentAlreadyExistsError,
  LessonContentNotFoundError,
  type ContentError,
} from '../../domain/errors/content-errors.js';
import {
  ContentId,
  ExampleId,
  SummaryId,
  TheoryId,
} from '../../domain/identifiers/content-identifiers.js';
import {
  CommonMistakeText,
  ConnectionText,
  DisplayOrder,
  ExampleCode,
  ExampleExplanation,
  ExampleTitle,
  KeyConceptName,
  SummaryText,
  TheoryText,
} from '../../domain/value-objects/content-value-objects.js';
import type {
  AddExampleInput,
  AddExampleOutput,
  AddKeyConceptInput,
  ContentVersionOutput,
  CreateLessonContentInput,
  CreateLessonContentOutput,
  PublishLessonContentInput,
  UpdateSummaryInput,
  UpdateTheoryInput,
} from '../dtos/content-commands.js';
import type { ContentRepository } from '../ports/content-repository.js';

interface ContentUseCaseDependencies {
  readonly clock: Clock;
  readonly repository: ContentRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}
type ContentUseCaseResult<T> = Promise<ResultType<T, ContentError>>;

export class CreateLessonContent {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  async execute(input: CreateLessonContentInput): ContentUseCaseResult<CreateLessonContentOutput> {
    const prepared = prepareContent(input, this.dependencies.uuidService);
    if (!prepared.isSuccess) return prepared;
    return this.dependencies.unitOfWork.execute(async () => {
      if (await this.dependencies.repository.findActiveByLessonId(input.lessonId))
        return Result.failure(new LessonContentAlreadyExistsError());
      const now = this.dependencies.clock.now();
      const content = LessonContent.create({
        ...prepared.value,
        createdAt: now,
        eventId: this.dependencies.uuidService.generate(),
        id: ContentId.create(this.dependencies.uuidService.generate()),
        lessonId: input.lessonId,
        updatedAt: now,
      });
      await this.dependencies.repository.save(content);
      return Result.success(
        Object.freeze({ contentId: content.id, version: content.aggregateVersion }),
      );
    });
  }
}

export class UpdateTheory {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  async execute(input: UpdateTheoryInput): ContentUseCaseResult<ContentVersionOutput> {
    const text = TheoryText.create(input.theory);
    if (!text.isSuccess) return text;
    return mutate(this.dependencies, input.contentId, (content) =>
      content.updateTheory(text.value, transition(this.dependencies)),
    );
  }
}

export class AddKeyConcept {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  async execute(input: AddKeyConceptInput): ContentUseCaseResult<ContentVersionOutput> {
    const name = KeyConceptName.create(input.name);
    if (!name.isSuccess) return name;
    const order = DisplayOrder.create(input.order);
    if (!order.isSuccess) return order;
    const concept = KeyConcept.create(name.value, order.value);
    return mutate(this.dependencies, input.contentId, (content) =>
      content.addKeyConcept(concept, transition(this.dependencies)),
    );
  }
}

export class AddExample {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  async execute(input: AddExampleInput): ContentUseCaseResult<AddExampleOutput> {
    const prepared = prepareExample(input, this.dependencies.uuidService);
    if (!prepared.isSuccess) return prepared;
    return this.dependencies.unitOfWork.execute(async () => {
      const content = await this.dependencies.repository.findById(input.contentId);
      if (!content) return Result.failure(new LessonContentNotFoundError());
      const addition = content.addExample(prepared.value, transition(this.dependencies));
      if (!addition.isSuccess) return addition;
      await this.dependencies.repository.save(content);
      return Result.success(
        Object.freeze({ exampleId: prepared.value.id, version: content.aggregateVersion }),
      );
    });
  }
}

export class UpdateSummary {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  async execute(input: UpdateSummaryInput): ContentUseCaseResult<ContentVersionOutput> {
    const text = SummaryText.create(input.summary);
    if (!text.isSuccess) return text;
    return mutate(this.dependencies, input.contentId, (content) =>
      content.updateSummary(text.value, transition(this.dependencies)),
    );
  }
}

export class PublishLessonContent {
  constructor(private readonly dependencies: ContentUseCaseDependencies) {}
  execute(input: PublishLessonContentInput): ContentUseCaseResult<ContentVersionOutput> {
    return mutate(this.dependencies, input.contentId, (content) =>
      content.publish(transition(this.dependencies)),
    );
  }
}

async function mutate(
  dependencies: ContentUseCaseDependencies,
  contentId: ContentId,
  mutation: (content: LessonContent) => ResultType<void, ContentError>,
): ContentUseCaseResult<ContentVersionOutput> {
  return dependencies.unitOfWork.execute(async () => {
    const content = await dependencies.repository.findById(contentId);
    if (!content) return Result.failure(new LessonContentNotFoundError());
    const result = mutation(content);
    if (!result.isSuccess) return result;
    await dependencies.repository.save(content);
    return Result.success(Object.freeze({ version: content.aggregateVersion }));
  });
}

function prepareContent(
  input: CreateLessonContentInput,
  uuidService: UuidService,
): ResultType<
  {
    readonly commonMistakes: readonly CommonMistakeText[];
    readonly connectionWithPreviousLesson: ConnectionText;
    readonly examples: readonly Example[];
    readonly keyConcepts: readonly KeyConcept[];
    readonly metadata: Metadata;
    readonly summary: Summary;
    readonly theory: Theory;
  },
  ContentError
> {
  const theoryText = TheoryText.create(input.theory);
  if (!theoryText.isSuccess) return theoryText;
  const summaryText = SummaryText.create(input.summary);
  if (!summaryText.isSuccess) return summaryText;
  const connection = ConnectionText.create(input.connectionWithPreviousLesson);
  if (!connection.isSuccess) return connection;
  const metadata = Metadata.create({ ...input.metadata, generator: 'Manual' });
  if (!metadata.isSuccess) return metadata;
  if (input.keyConcepts.length === 0)
    return Result.failure(new IncompleteLessonContentError('missing-key-concept'));
  if (input.examples.length === 0)
    return Result.failure(new IncompleteLessonContentError('missing-example'));
  const keyConcepts: KeyConcept[] = [];
  for (const candidate of input.keyConcepts) {
    const name = KeyConceptName.create(candidate.name);
    if (!name.isSuccess) return name;
    const order = DisplayOrder.create(candidate.order);
    if (!order.isSuccess) return order;
    if (keyConcepts.some((item) => item.name.canonicalValue === name.value.canonicalValue))
      return Result.failure(new DuplicateContentElementError('KeyConcept', 'name'));
    if (keyConcepts.some((item) => item.order.value === order.value.value))
      return Result.failure(new DuplicateContentElementError('KeyConcept', 'order'));
    keyConcepts.push(KeyConcept.create(name.value, order.value));
  }
  const examples: Example[] = [];
  for (const candidate of input.examples) {
    const example = prepareExample(candidate, uuidService);
    if (!example.isSuccess) return example;
    if (examples.some((item) => item.title.canonicalValue === example.value.title.canonicalValue))
      return Result.failure(new DuplicateContentElementError('Example', 'title'));
    if (examples.some((item) => item.order.value === example.value.order.value))
      return Result.failure(new DuplicateContentElementError('Example', 'order'));
    examples.push(example.value);
  }
  const commonMistakes: CommonMistakeText[] = [];
  for (const candidate of input.commonMistakes ?? []) {
    const mistake = CommonMistakeText.create(candidate);
    if (!mistake.isSuccess) return mistake;
    if (commonMistakes.some((item) => item.canonicalValue === mistake.value.canonicalValue))
      return Result.failure(new DuplicateContentElementError('CommonMistake', 'text'));
    commonMistakes.push(mistake.value);
  }
  return Result.success({
    commonMistakes,
    connectionWithPreviousLesson: connection.value,
    examples,
    keyConcepts,
    metadata: metadata.value,
    summary: Summary.create(SummaryId.create(uuidService.generate()), summaryText.value),
    theory: Theory.create(TheoryId.create(uuidService.generate()), theoryText.value),
  });
}

function prepareExample(
  input: {
    readonly code: string;
    readonly explanation: string;
    readonly order: number;
    readonly title: string;
  },
  uuidService: UuidService,
): ResultType<Example, ContentError> {
  const title = ExampleTitle.create(input.title);
  if (!title.isSuccess) return title;
  const explanation = ExampleExplanation.create(input.explanation);
  if (!explanation.isSuccess) return explanation;
  const code = ExampleCode.create(input.code);
  if (!code.isSuccess) return code;
  const order = DisplayOrder.create(input.order);
  if (!order.isSuccess) return order;
  return Result.success(
    Example.create({
      code: code.value,
      explanation: explanation.value,
      id: ExampleId.create(uuidService.generate()),
      order: order.value,
      title: title.value,
    }),
  );
}
function transition(dependencies: ContentUseCaseDependencies): {
  readonly eventId: ReturnType<UuidService['generate']>;
  readonly occurredAt: Date;
} {
  return { eventId: dependencies.uuidService.generate(), occurredAt: dependencies.clock.now() };
}
