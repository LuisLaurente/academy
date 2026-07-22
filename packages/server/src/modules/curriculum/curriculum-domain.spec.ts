import { describe, expect, it } from 'vitest';

import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { Result as ResultType } from '../../core/result/result.js';
import { Concept, Lesson, Level, Sublevel, Topic } from './domain/aggregates/topic.js';
import {
  CurriculumElementNotFoundError,
  DuplicateCurriculumElementError,
  IncompleteCurriculumHierarchyError,
  InvalidCurriculumDateError,
  InvalidCurriculumStateError,
  InvalidCurriculumTextError,
  InvalidDifficultyLevelError,
  InvalidLearningOrderError,
} from './domain/errors/curriculum-errors.js';
import {
  ConceptId,
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from './domain/identifiers/curriculum-identifiers.js';
import {
  ConceptName,
  DifficultyLevel,
  LearningOrder,
  LessonTitle,
  TopicDescription,
  TopicName,
} from './domain/value-objects/curriculum-value-objects.js';

const uuidService = new CryptoUuidService();
const NOW = new Date('2026-07-21T20:00:00.000Z');

function success<TValue, TError>(result: ResultType<TValue, TError>): TValue {
  if (!result.isSuccess) throw result.error;
  return result.value;
}

function order(value = 1): LearningOrder {
  return success(LearningOrder.create(value));
}

function difficulty(value = 1): DifficultyLevel {
  return success(DifficultyLevel.create(value));
}

function concept(
  name = 'Variables',
  position = 1,
  id = ConceptId.create(uuidService.generate()),
): Concept {
  return Concept.create({
    difficulty: difficulty(),
    id,
    name: success(ConceptName.create(name)),
    order: order(position),
  });
}

function lesson(
  title = 'Declaración de variables',
  position = 1,
  concepts: readonly Concept[] = [],
  id = LessonId.create(uuidService.generate()),
): Lesson {
  return Lesson.create({
    concepts,
    id,
    order: order(position),
    title: success(LessonTitle.create(title)),
  });
}

function sublevel(
  name = 'Declaración',
  position = 1,
  lessons: readonly Lesson[] = [],
  id = SublevelId.create(uuidService.generate()),
): Sublevel {
  return success(
    Sublevel.create({ difficulty: difficulty(), id, lessons, name, order: order(position) }),
  );
}

function level(
  name = 'Fundamentos',
  position = 1,
  sublevels: readonly Sublevel[] = [],
  id = LevelId.create(uuidService.generate()),
): Level {
  return success(
    Level.create({ difficulty: difficulty(), id, name, order: order(position), sublevels }),
  );
}

function draftTopic(): Topic {
  return Topic.create({
    createdAt: NOW,
    description: success(TopicDescription.create('Aprende los fundamentos de Python.')),
    eventId: uuidService.generate(),
    id: TopicId.create(uuidService.generate()),
    name: success(TopicName.create('Python')),
    updatedAt: NOW,
  });
}

function completeLevel(): Level {
  return level('Fundamentos', 1, [sublevel('Declaración', 1, [lesson(undefined, 1, [concept()])])]);
}

describe('curriculum identifiers', () => {
  it.each([
    ['TopicId', (value: ReturnType<typeof uuidService.generate>) => TopicId.create(value)],
    ['LevelId', (value: ReturnType<typeof uuidService.generate>) => LevelId.create(value)],
    ['SublevelId', (value: ReturnType<typeof uuidService.generate>) => SublevelId.create(value)],
    ['LessonId', (value: ReturnType<typeof uuidService.generate>) => LessonId.create(value)],
    ['ConceptId', (value: ReturnType<typeof uuidService.generate>) => ConceptId.create(value)],
  ] as const)('creates value-semantic %s instances', (_name, create) => {
    const value = uuidService.generate();
    expect(create(value).equals(create(value))).toBe(true);
    expect(create(value).equals(create(uuidService.generate()))).toBe(false);
  });
});

describe('curriculum value objects', () => {
  it('normalizes textual values and compares them by value', () => {
    const first = success(TopicName.create('  Data   Science  '));
    const second = success(TopicName.create('Data Science'));
    const description = success(
      TopicDescription.create('  Aprende   conceptos esenciales de datos.  '),
    );

    expect(first.value).toBe('Data Science');
    expect(first.equals(second)).toBe(true);
    expect(first.canonicalValue).toBe('data science');
    expect(description.value).toBe('Aprende conceptos esenciales de datos.');
    expect(Object.isFrozen(first)).toBe(true);
  });

  it.each([
    TopicName.create(''),
    TopicName.create('x'.repeat(121)),
    TopicDescription.create('corta'),
    TopicDescription.create('x'.repeat(2_001)),
    LessonTitle.create(' '),
    LessonTitle.create('x'.repeat(161)),
    ConceptName.create(' '),
    ConceptName.create('x'.repeat(121)),
  ])('rejects empty or out-of-range curriculum text', (result) => {
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidCurriculumTextError);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid learning order %s',
    (candidate) => {
      const result = LearningOrder.create(candidate);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidLearningOrderError);
    },
  );

  it.each([0, 1.5, 6])('rejects invalid difficulty %s', (candidate) => {
    const result = DifficultyLevel.create(candidate);
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidDifficultyLevelError);
  });

  it('accepts and compares valid order and difficulty values', () => {
    expect(order(2).equals(order(2))).toBe(true);
    expect(difficulty(5).equals(difficulty(5))).toBe(true);
    expect(difficulty(1).equals(difficulty(5))).toBe(false);
  });
});

describe('curriculum entities', () => {
  it('keeps descendants immutable and free of parent back-references', () => {
    const childConcept = concept();
    const originalLesson = lesson();
    const updatedLesson = success(originalLesson.withConcept(childConcept));

    expect(originalLesson.concepts).toHaveLength(0);
    expect(updatedLesson.concepts).toEqual([childConcept]);
    expect('lesson' in childConcept).toBe(false);
    expect('sublevel' in updatedLesson).toBe(false);
    expect(Object.isFrozen(updatedLesson)).toBe(true);
    expect(Object.isFrozen(updatedLesson.concepts)).toBe(true);
  });

  it('sorts children by LearningOrder independently of insertion order', () => {
    const updated = success(
      success(lesson().withConcept(concept('Funciones', 2))).withConcept(concept('Variables', 1)),
    );
    expect(updated.concepts.map((item) => item.name.value)).toEqual(['Variables', 'Funciones']);
  });

  it.each([() => level(' '), () => sublevel('x'.repeat(121))])(
    'rejects invalid Level and Sublevel names',
    (create) => {
      expect(create).toThrow(InvalidCurriculumTextError);
    },
  );

  it('rejects duplicate child identity, name and order', () => {
    const first = concept('Variables', 1);
    const base = success(lesson().withConcept(first));
    const cases = [
      concept('Otro concepto', 2, first.id),
      concept(' variables ', 2),
      concept('Funciones', 1),
    ];
    for (const candidate of cases) {
      const result = base.withConcept(candidate);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(DuplicateCurriculumElementError);
    }
  });
});

describe('Topic aggregate', () => {
  it('creates a draft with defensive dates and a TopicCreated event', () => {
    const topic = draftTopic();
    const externalDate = topic.createdAt;
    externalDate.setUTCFullYear(2030);

    expect(topic.status).toBe('draft');
    expect(topic.levels).toEqual([]);
    expect(topic.createdAt).toEqual(NOW);
    expect(topic.updatedAt).toEqual(NOW);
    expect(topic.aggregateVersion).toBe(1);
    expect(topic.pendingDomainEvents[0]?.eventName).toBe('TopicCreated');
    expect(topic.pendingDomainEvents[0]?.payload).toEqual({});
  });

  it('builds the hierarchy only through Topic and records ordered events', () => {
    const topic = draftTopic();
    const childLevel = level();
    const childSublevel = sublevel();
    const childLesson = lesson();
    const childConcept = concept();
    const transition = () => ({ eventId: uuidService.generate(), occurredAt: NOW });

    expect(topic.addLevel(childLevel, transition()).isSuccess).toBe(true);
    expect(topic.addSublevel(childLevel.id, childSublevel, transition()).isSuccess).toBe(true);
    expect(topic.addLesson(childSublevel.id, childLesson, transition()).isSuccess).toBe(true);
    expect(topic.addConcept(childLesson.id, childConcept, transition()).isSuccess).toBe(true);

    expect(topic.aggregateVersion).toBe(5);
    expect(topic.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'TopicCreated',
      'LevelAdded',
      'SublevelAdded',
      'LessonAdded',
      'ConceptAdded',
    ]);
    expect(topic.levels[0]?.sublevels[0]?.lessons[0]?.concepts[0]).toBe(childConcept);
    expect(topic.validateStructure().isSuccess).toBe(true);
  });

  it('returns hierarchy errors when a requested parent does not belong to the topic', () => {
    const topic = draftTopic();
    const transition = { eventId: uuidService.generate(), occurredAt: NOW };
    const results = [
      topic.addSublevel(LevelId.create(uuidService.generate()), sublevel(), transition),
      topic.addLesson(SublevelId.create(uuidService.generate()), lesson(), transition),
      topic.addConcept(LessonId.create(uuidService.generate()), concept(), transition),
    ];
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(CurriculumElementNotFoundError);
    }
  });

  it('rejects duplicate names and orders among siblings', () => {
    const topic = draftTopic();
    const transition = { eventId: uuidService.generate(), occurredAt: NOW };
    expect(topic.addLevel(level('Fundamentos', 1), transition).isSuccess).toBe(true);
    for (const candidate of [level(' fundamentos ', 2), level('Intermedio', 1)]) {
      const result = topic.addLevel(candidate, transition);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(DuplicateCurriculumElementError);
    }
  });

  it('rejects duplicate semantic concepts across different lessons', () => {
    const firstLesson = lesson('Primera lección', 1, [concept('Variables')]);
    const secondLesson = lesson('Segunda lección', 2);
    const childSublevel = sublevel('Declaración', 1, [firstLesson, secondLesson]);
    const childLevel = level('Fundamentos', 1, [childSublevel]);
    const topic = draftTopic();
    const transition = { eventId: uuidService.generate(), occurredAt: NOW };
    topic.addLevel(childLevel, transition);

    const result = topic.addConcept(secondLesson.id, concept(' variables '), transition);
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error).toBeInstanceOf(DuplicateCurriculumElementError);
      expect(result.error.context).toEqual({ conflictingField: 'name', elementType: 'Concept' });
    }
  });

  it('requires complete, contiguous hierarchy before activation', () => {
    const topic = draftTopic();
    const empty = topic.validateStructure();
    expect(empty.isSuccess).toBe(false);
    if (!empty.isSuccess) expect(empty.error).toBeInstanceOf(IncompleteCurriculumHierarchyError);

    topic.addLevel(
      level('Intermedio', 2, [sublevel(undefined, 1, [lesson(undefined, 1, [concept()])])]),
      {
        eventId: uuidService.generate(),
        occurredAt: NOW,
      },
    );
    const gap = topic.validateStructure();
    expect(gap.isSuccess).toBe(false);
    if (!gap.isSuccess)
      expect(gap.error.context).toEqual({ reason: 'level-order-is-not-contiguous' });

    expect(() =>
      Topic.rehydrate({
        aggregateVersion: 1,
        createdAt: NOW,
        description: success(TopicDescription.create('Una descripción curricular válida.')),
        id: TopicId.create(uuidService.generate()),
        levels: [],
        name: success(TopicName.create('Incompleto')),
        status: 'active',
        updatedAt: NOW,
      }),
    ).toThrow(IncompleteCurriculumHierarchyError);
  });

  it('allows rehydrating a complete active topic but prohibits further mutation', () => {
    const active = Topic.rehydrate({
      aggregateVersion: 5,
      createdAt: NOW,
      description: success(TopicDescription.create('Una descripción curricular válida.')),
      id: TopicId.create(uuidService.generate()),
      levels: [completeLevel()],
      name: success(TopicName.create('Python')),
      status: 'active',
      updatedAt: NOW,
    });
    const result = active.addLevel(level('Avanzado', 2), {
      eventId: uuidService.generate(),
      occurredAt: NOW,
    });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidCurriculumStateError);
    expect(active.pendingDomainEvents).toEqual([]);
  });

  it('rejects invalid chronology and decreasing transition time', () => {
    expect(() =>
      Topic.rehydrate({
        aggregateVersion: 1,
        createdAt: NOW,
        description: success(TopicDescription.create('Una descripción curricular válida.')),
        id: TopicId.create(uuidService.generate()),
        name: success(TopicName.create('Python')),
        status: 'draft',
        updatedAt: new Date(NOW.getTime() - 1),
      }),
    ).toThrow(InvalidCurriculumDateError);

    const topic = draftTopic();
    expect(() =>
      topic.addLevel(level(), {
        eventId: uuidService.generate(),
        occurredAt: new Date(NOW.getTime() - 1),
      }),
    ).toThrow(InvalidCurriculumDateError);
  });
});
