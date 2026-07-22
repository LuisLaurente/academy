import type { UuidService } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import type { Clock } from '../../../../core/time/clock.js';
import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type {
  AddConceptInput,
  AddConceptOutput,
  AddLessonInput,
  AddLessonOutput,
  AddLevelInput,
  AddLevelOutput,
  AddSublevelInput,
  AddSublevelOutput,
  CreateTopicInput,
  CreateTopicOutput,
} from '../dtos/curriculum-commands.js';
import type { CurriculumRepository } from '../ports/curriculum-repository.js';
import { Concept, Lesson, Level, Sublevel, Topic } from '../../domain/aggregates/topic.js';
import {
  CurriculumElementNotFoundError,
  type CurriculumError,
  DuplicateCurriculumElementError,
} from '../../domain/errors/curriculum-errors.js';
import {
  ConceptId,
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from '../../domain/identifiers/curriculum-identifiers.js';
import {
  ConceptName,
  DifficultyLevel,
  LearningOrder,
  LessonTitle,
  TopicDescription,
  TopicName,
} from '../../domain/value-objects/curriculum-value-objects.js';

interface CurriculumUseCaseDependencies {
  readonly clock: Clock;
  readonly repository: CurriculumRepository;
  readonly unitOfWork: UnitOfWork;
  readonly uuidService: UuidService;
}

type CurriculumUseCaseResult<TOutput> = Promise<ResultType<TOutput, CurriculumError>>;

export class CreateTopic {
  readonly #dependencies: CurriculumUseCaseDependencies;

  constructor(dependencies: CurriculumUseCaseDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(input: CreateTopicInput): CurriculumUseCaseResult<CreateTopicOutput> {
    const name = TopicName.create(input.name);
    if (!name.isSuccess) return name;
    const description = TopicDescription.create(input.description);
    if (!description.isSuccess) return description;

    return this.#dependencies.unitOfWork.execute(async () => {
      if ((await this.#dependencies.repository.findByName(name.value)) !== undefined) {
        return Result.failure(new DuplicateCurriculumElementError('Topic', 'name'));
      }
      const now = this.#dependencies.clock.now();
      const topic = Topic.create({
        createdAt: now,
        description: description.value,
        eventId: this.#dependencies.uuidService.generate(),
        id: TopicId.create(this.#dependencies.uuidService.generate()),
        name: name.value,
        updatedAt: now,
      });
      await this.#dependencies.repository.save(topic);
      return Result.success(Object.freeze({ topicId: topic.id }));
    });
  }
}

export class AddLevel {
  readonly #dependencies: CurriculumUseCaseDependencies;

  constructor(dependencies: CurriculumUseCaseDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(input: AddLevelInput): CurriculumUseCaseResult<AddLevelOutput> {
    const order = LearningOrder.create(input.order);
    if (!order.isSuccess) return order;
    const difficulty = DifficultyLevel.create(input.difficulty);
    if (!difficulty.isSuccess) return difficulty;
    const levelId = LevelId.create(this.#dependencies.uuidService.generate());
    const level = Level.create({
      difficulty: difficulty.value,
      id: levelId,
      name: input.name,
      order: order.value,
    });
    if (!level.isSuccess) return level;

    return this.#dependencies.unitOfWork.execute(async () => {
      const topic = await this.#dependencies.repository.findById(input.topicId);
      if (topic === undefined) return Result.failure(new CurriculumElementNotFoundError('Topic'));
      const addition = topic.addLevel(level.value, this.transition());
      if (!addition.isSuccess) return addition;
      await this.#dependencies.repository.save(topic);
      return Result.success(Object.freeze({ levelId }));
    });
  }

  private transition(): {
    readonly eventId: ReturnType<UuidService['generate']>;
    readonly occurredAt: Date;
  } {
    return {
      eventId: this.#dependencies.uuidService.generate(),
      occurredAt: this.#dependencies.clock.now(),
    };
  }
}

export class AddSublevel {
  readonly #dependencies: CurriculumUseCaseDependencies;

  constructor(dependencies: CurriculumUseCaseDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(input: AddSublevelInput): CurriculumUseCaseResult<AddSublevelOutput> {
    const order = LearningOrder.create(input.order);
    if (!order.isSuccess) return order;
    const difficulty = DifficultyLevel.create(input.difficulty);
    if (!difficulty.isSuccess) return difficulty;
    const sublevelId = SublevelId.create(this.#dependencies.uuidService.generate());
    const sublevel = Sublevel.create({
      difficulty: difficulty.value,
      id: sublevelId,
      name: input.name,
      order: order.value,
    });
    if (!sublevel.isSuccess) return sublevel;

    return this.#dependencies.unitOfWork.execute(async () => {
      const topic = await this.#dependencies.repository.findById(input.topicId);
      if (topic === undefined) return Result.failure(new CurriculumElementNotFoundError('Topic'));
      const addition = topic.addSublevel(input.levelId, sublevel.value, this.transition());
      if (!addition.isSuccess) return addition;
      await this.#dependencies.repository.save(topic);
      return Result.success(Object.freeze({ sublevelId }));
    });
  }

  private transition(): {
    readonly eventId: ReturnType<UuidService['generate']>;
    readonly occurredAt: Date;
  } {
    return {
      eventId: this.#dependencies.uuidService.generate(),
      occurredAt: this.#dependencies.clock.now(),
    };
  }
}

export class AddLesson {
  readonly #dependencies: CurriculumUseCaseDependencies;

  constructor(dependencies: CurriculumUseCaseDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(input: AddLessonInput): CurriculumUseCaseResult<AddLessonOutput> {
    const order = LearningOrder.create(input.order);
    if (!order.isSuccess) return order;
    const title = LessonTitle.create(input.title);
    if (!title.isSuccess) return title;
    const lessonId = LessonId.create(this.#dependencies.uuidService.generate());
    const lesson = Lesson.create({ id: lessonId, order: order.value, title: title.value });

    return this.#dependencies.unitOfWork.execute(async () => {
      const topic = await this.#dependencies.repository.findById(input.topicId);
      if (topic === undefined) return Result.failure(new CurriculumElementNotFoundError('Topic'));
      const addition = topic.addLesson(input.sublevelId, lesson, this.transition());
      if (!addition.isSuccess) return addition;
      await this.#dependencies.repository.save(topic);
      return Result.success(Object.freeze({ lessonId }));
    });
  }

  private transition(): {
    readonly eventId: ReturnType<UuidService['generate']>;
    readonly occurredAt: Date;
  } {
    return {
      eventId: this.#dependencies.uuidService.generate(),
      occurredAt: this.#dependencies.clock.now(),
    };
  }
}

export class AddConcept {
  readonly #dependencies: CurriculumUseCaseDependencies;

  constructor(dependencies: CurriculumUseCaseDependencies) {
    this.#dependencies = dependencies;
  }

  async execute(input: AddConceptInput): CurriculumUseCaseResult<AddConceptOutput> {
    const order = LearningOrder.create(input.order);
    if (!order.isSuccess) return order;
    const difficulty = DifficultyLevel.create(input.difficulty);
    if (!difficulty.isSuccess) return difficulty;
    const name = ConceptName.create(input.name);
    if (!name.isSuccess) return name;
    const conceptId = ConceptId.create(this.#dependencies.uuidService.generate());
    const concept = Concept.create({
      difficulty: difficulty.value,
      id: conceptId,
      name: name.value,
      order: order.value,
    });

    return this.#dependencies.unitOfWork.execute(async () => {
      const topic = await this.#dependencies.repository.findById(input.topicId);
      if (topic === undefined) return Result.failure(new CurriculumElementNotFoundError('Topic'));
      const addition = topic.addConcept(input.lessonId, concept, this.transition());
      if (!addition.isSuccess) return addition;
      await this.#dependencies.repository.save(topic);
      return Result.success(Object.freeze({ conceptId }));
    });
  }

  private transition(): {
    readonly eventId: ReturnType<UuidService['generate']>;
    readonly occurredAt: Date;
  } {
    return {
      eventId: this.#dependencies.uuidService.generate(),
      occurredAt: this.#dependencies.clock.now(),
    };
  }
}
