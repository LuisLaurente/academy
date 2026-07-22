import { describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { Clock } from '../../core/time/clock.js';
import {
  AddConcept,
  AddLesson,
  AddLevel,
  AddSublevel,
  CreateTopic,
} from './application/use-cases/curriculum-use-cases.js';
import {
  CurriculumElementNotFoundError,
  DuplicateCurriculumElementError,
  InvalidCurriculumTextError,
  InvalidDifficultyLevelError,
  InvalidLearningOrderError,
} from './domain/errors/curriculum-errors.js';
import {
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from './domain/identifiers/curriculum-identifiers.js';
import { TopicName } from './domain/value-objects/curriculum-value-objects.js';
import {
  InMemoryCurriculumRepository,
  InMemoryCurriculumUnitOfWork,
} from './infrastructure/testing/in-memory-curriculum.js';

const NOW = new Date('2026-07-21T20:00:00.000Z');

class FixedClock implements Clock {
  now(): Date {
    return new Date(NOW);
  }
}

interface Fixture {
  readonly addConcept: AddConcept;
  readonly addLesson: AddLesson;
  readonly addLevel: AddLevel;
  readonly addSublevel: AddSublevel;
  readonly createTopic: CreateTopic;
  readonly repository: InMemoryCurriculumRepository;
}

function createFixture(): Fixture {
  const repository = new InMemoryCurriculumRepository();
  const unitOfWork = new InMemoryCurriculumUnitOfWork();
  const dependencies = {
    clock: new FixedClock(),
    repository,
    unitOfWork,
    uuidService: new CryptoUuidService(),
  };
  return {
    addConcept: new AddConcept(dependencies),
    addLesson: new AddLesson(dependencies),
    addLevel: new AddLevel(dependencies),
    addSublevel: new AddSublevel(dependencies),
    createTopic: new CreateTopic(dependencies),
    repository,
  };
}

async function createTopic(fixture: Fixture, name = 'Python'): Promise<TopicId> {
  const result = await fixture.createTopic.execute({
    description: `Plan de aprendizaje completo para ${name}.`,
    name,
  });
  if (!result.isSuccess) throw result.error;
  return result.value.topicId;
}

async function buildHierarchy(
  fixture: Fixture,
  topicId: TopicId,
): Promise<{
  lessonId: LessonId;
  levelId: LevelId;
  sublevelId: SublevelId;
}> {
  const level = await fixture.addLevel.execute({
    difficulty: 1,
    name: 'Fundamentos',
    order: 1,
    topicId,
  });
  if (!level.isSuccess) throw level.error;
  const sublevel = await fixture.addSublevel.execute({
    difficulty: 1,
    levelId: level.value.levelId,
    name: 'Declaración',
    order: 1,
    topicId,
  });
  if (!sublevel.isSuccess) throw sublevel.error;
  const lesson = await fixture.addLesson.execute({
    order: 1,
    sublevelId: sublevel.value.sublevelId,
    title: 'Declaración de variables',
    topicId,
  });
  if (!lesson.isSuccess) throw lesson.error;
  return {
    lessonId: lesson.value.lessonId,
    levelId: level.value.levelId,
    sublevelId: sublevel.value.sublevelId,
  };
}

describe('Curriculum use cases', () => {
  it('creates and persists a normalized draft Topic', async () => {
    const fixture = createFixture();
    const result = await fixture.createTopic.execute({
      description: '  Aprende   programación desde sus fundamentos. ',
      name: '  Python  ',
    });

    expect(result.isSuccess).toBe(true);
    expect(fixture.repository.size).toBe(1);
    if (!result.isSuccess) return;
    const topic = await fixture.repository.findById(result.value.topicId);
    expect(topic?.name.value).toBe('Python');
    expect(topic?.description.value).toBe('Aprende programación desde sus fundamentos.');
    expect(topic?.status).toBe('draft');
    expect(topic?.pendingDomainEvents[0]?.eventName).toBe('TopicCreated');
  });

  it('prevents duplicate topics atomically using canonical names', async () => {
    const fixture = createFixture();
    const results = await Promise.all([
      fixture.createTopic.execute({
        description: 'Un currículo suficientemente descriptivo.',
        name: 'Python',
      }),
      fixture.createTopic.execute({
        description: 'Otro currículo suficientemente descriptivo.',
        name: ' python ',
      }),
    ]);

    expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
    const failure = results.find((result) => !result.isSuccess);
    expect(failure?.isSuccess).toBe(false);
    if (failure !== undefined && !failure.isSuccess) {
      expect(failure.error).toBeInstanceOf(DuplicateCurriculumElementError);
    }
    expect(fixture.repository.size).toBe(1);
  });

  it.each([
    {
      description: 'Descripción válida para el currículo.',
      expected: InvalidCurriculumTextError,
      name: '',
    },
    { description: 'corta', expected: InvalidCurriculumTextError, name: 'Python' },
  ])('rejects invalid topic input', async ({ description, expected, name }) => {
    const result = await createFixture().createTopic.execute({ description, name });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(expected);
  });

  it('builds Topic → Level → Sublevel → Lesson → Concept and persists every event', async () => {
    const fixture = createFixture();
    const topicId = await createTopic(fixture);
    const hierarchy = await buildHierarchy(fixture, topicId);
    const concept = await fixture.addConcept.execute({
      difficulty: 1,
      lessonId: hierarchy.lessonId,
      name: 'Variables',
      order: 1,
      topicId,
    });
    expect(concept.isSuccess).toBe(true);

    const topic = await fixture.repository.findById(topicId);
    expect(topic?.validateStructure().isSuccess).toBe(true);
    expect(topic?.levels[0]?.sublevels[0]?.lessons[0]?.concepts[0]?.name.value).toBe('Variables');
    expect(topic?.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'TopicCreated',
      'LevelAdded',
      'SublevelAdded',
      'LessonAdded',
      'ConceptAdded',
    ]);
    expect(topic?.pendingDomainEvents.at(-1)?.payload).toEqual({
      conceptId: concept.isSuccess ? concept.value.conceptId.toString() : '',
      lessonId: hierarchy.lessonId.toString(),
    });
  });

  it('rejects commands for a missing Topic without persisting anything', async () => {
    const fixture = createFixture();
    const topicId = TopicId.create(new CryptoUuidService().generate());
    const results = await Promise.all([
      fixture.addLevel.execute({ difficulty: 1, name: 'Fundamentos', order: 1, topicId }),
      fixture.addSublevel.execute({
        difficulty: 1,
        levelId: LevelId.create(new CryptoUuidService().generate()),
        name: 'Declaración',
        order: 1,
        topicId,
      }),
      fixture.addLesson.execute({
        order: 1,
        sublevelId: SublevelId.create(new CryptoUuidService().generate()),
        title: 'Declaración',
        topicId,
      }),
      fixture.addConcept.execute({
        difficulty: 1,
        lessonId: LessonId.create(new CryptoUuidService().generate()),
        name: 'Variables',
        order: 1,
        topicId,
      }),
    ]);
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(CurriculumElementNotFoundError);
    }
    expect(fixture.repository.size).toBe(0);
  });

  it('rejects inconsistent parent hierarchy', async () => {
    const fixture = createFixture();
    const topicId = await createTopic(fixture);
    const results = [
      await fixture.addSublevel.execute({
        difficulty: 1,
        levelId: LevelId.create(new CryptoUuidService().generate()),
        name: 'Declaración',
        order: 1,
        topicId,
      }),
      await fixture.addLesson.execute({
        order: 1,
        sublevelId: SublevelId.create(new CryptoUuidService().generate()),
        title: 'Declaración',
        topicId,
      }),
      await fixture.addConcept.execute({
        difficulty: 1,
        lessonId: LessonId.create(new CryptoUuidService().generate()),
        name: 'Variables',
        order: 1,
        topicId,
      }),
    ];
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(CurriculumElementNotFoundError);
    }
  });

  it('rejects duplicate sibling name and order through use cases', async () => {
    const fixture = createFixture();
    const topicId = await createTopic(fixture);
    const first = await fixture.addLevel.execute({
      difficulty: 1,
      name: 'Fundamentos',
      order: 1,
      topicId,
    });
    expect(first.isSuccess).toBe(true);
    for (const input of [
      { difficulty: 2, name: ' fundamentos ', order: 2, topicId },
      { difficulty: 2, name: 'Intermedio', order: 1, topicId },
    ]) {
      const result = await fixture.addLevel.execute(input);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(DuplicateCurriculumElementError);
    }
  });

  it.each([
    { difficulty: 0, expected: InvalidDifficultyLevelError, name: 'Fundamentos', order: 1 },
    { difficulty: 1, expected: InvalidLearningOrderError, name: 'Fundamentos', order: 0 },
    { difficulty: 1, expected: InvalidCurriculumTextError, name: '', order: 1 },
  ])(
    'validates Level input before loading the aggregate',
    async ({ difficulty, expected, name, order }) => {
      const fixture = createFixture();
      const result = await fixture.addLevel.execute({
        difficulty,
        name,
        order,
        topicId: TopicId.create(new CryptoUuidService().generate()),
      });
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(expected);
    },
  );

  it('validates Sublevel, Lesson and Concept input at their application boundaries', async () => {
    const fixture = createFixture();
    const topicId = await createTopic(fixture);
    const invalidSublevel = await fixture.addSublevel.execute({
      difficulty: 6,
      levelId: LevelId.create(new CryptoUuidService().generate()),
      name: 'Declaración',
      order: 1,
      topicId,
    });
    const invalidLesson = await fixture.addLesson.execute({
      order: 0,
      sublevelId: SublevelId.create(new CryptoUuidService().generate()),
      title: 'Declaración',
      topicId,
    });
    const invalidConcept = await fixture.addConcept.execute({
      difficulty: 1,
      lessonId: LessonId.create(new CryptoUuidService().generate()),
      name: '',
      order: 1,
      topicId,
    });
    expect(invalidSublevel.isSuccess).toBe(false);
    expect(invalidLesson.isSuccess).toBe(false);
    expect(invalidConcept.isSuccess).toBe(false);
  });
});

describe('in-memory Curriculum infrastructure', () => {
  it('resolves topics by identity and canonical name', async () => {
    const fixture = createFixture();
    const topicId = await createTopic(fixture, 'Data Science');
    const name = TopicName.create(' data science ');
    if (!name.isSuccess) throw name.error;
    expect((await fixture.repository.findById(topicId))?.id.equals(topicId)).toBe(true);
    expect((await fixture.repository.findByName(name.value))?.id.equals(topicId)).toBe(true);
  });

  it('serializes work and continues after a failed transaction callback', async () => {
    const unitOfWork = new InMemoryCurriculumUnitOfWork();
    const order: string[] = [];
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = unitOfWork.execute(async () => {
      order.push('first:start');
      await gate;
      order.push('first:end');
      throw new Error('expected');
    });
    const second = unitOfWork.execute(async () => {
      order.push('second');
      return 2;
    });

    await Promise.resolve();
    expect(order).toEqual(['first:start']);
    release?.();
    await expect(first).rejects.toThrow('expected');
    await expect(second).resolves.toBe(2);
    expect(order).toEqual(['first:start', 'first:end', 'second']);
  });
});
