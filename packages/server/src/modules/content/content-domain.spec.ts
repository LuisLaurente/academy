import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { Result as ResultType } from '../../core/result/result.js';
import { LessonId } from '../curriculum/index.js';
import {
  Example,
  KeyConcept,
  LessonContent,
  Metadata,
  Summary,
  Theory,
} from './domain/aggregates/lesson-content.js';
import {
  DuplicateContentElementError,
  IncompleteLessonContentError,
  InvalidContentDateError,
  InvalidContentMetadataError,
  InvalidContentStateError,
  InvalidContentTextError,
  InvalidContentVersionError,
  InvalidDisplayOrderError,
} from './domain/errors/content-errors.js';
import {
  ContentId,
  ExampleId,
  SummaryId,
  TheoryId,
} from './domain/identifiers/content-identifiers.js';
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
} from './domain/value-objects/content-value-objects.js';

const uuid = new CryptoUuidService();
const NOW = new Date('2026-07-21T20:00:00.000Z');
function value<T, E>(result: ResultType<T, E>): T {
  if (!result.isSuccess) throw result.error;
  return result.value;
}
const order = (number = 1) => value(DisplayOrder.create(number));
const concept = (name = 'Variables', position = 1) =>
  KeyConcept.create(value(KeyConceptName.create(name)), order(position));
const example = (
  title = 'Asignación básica',
  position = 1,
  id = ExampleId.create(uuid.generate()),
) =>
  Example.create({
    code: value(ExampleCode.create('name = "Ada"')),
    explanation: value(ExampleExplanation.create('Asigna un texto a una variable.')),
    id,
    order: order(position),
    title: value(ExampleTitle.create(title)),
  });
const transition = (date = NOW) => ({ eventId: uuid.generate(), occurredAt: date });
function draft(
  overrides: Partial<Parameters<typeof LessonContent.rehydrate>[0]> = {},
): LessonContent {
  return LessonContent.rehydrate({
    aggregateVersion: 1,
    commonMistakes: [value(CommonMistakeText.create('Confundir asignación con igualdad.'))],
    connectionWithPreviousLesson: value(ConnectionText.create('Continúa desde los tipos básicos.')),
    createdAt: NOW,
    examples: [example()],
    id: ContentId.create(uuid.generate()),
    keyConcepts: [concept()],
    lessonId: LessonId.create(uuid.generate()),
    metadata: value(
      Metadata.create({
        difficulty: 1,
        estimatedReadingMinutes: 5,
        generator: 'Manual',
        language: 'es-PE',
        version: 1,
      }),
    ),
    status: 'draft',
    summary: Summary.create(
      SummaryId.create(uuid.generate()),
      value(SummaryText.create('Las variables guardan valores reutilizables.')),
    ),
    theory: Theory.create(
      TheoryId.create(uuid.generate()),
      value(TheoryText.create('Una variable relaciona un nombre legible con un valor.')),
    ),
    updatedAt: NOW,
    ...overrides,
  });
}

describe('Content identifiers and value objects', () => {
  it.each([ContentId, TheoryId, ExampleId, SummaryId])(
    'provides value-semantic typed identities',
    (Identifier) => {
      const raw = uuid.generate();
      expect(Identifier.create(raw).equals(Identifier.create(raw))).toBe(true);
      expect(Identifier.create(raw).equals(Identifier.create(uuid.generate()))).toBe(false);
    },
  );
  it('normalizes prose, labels and line endings while remaining immutable', () => {
    const theory = value(TheoryText.create('  First line.\r\nSecond line explains more.  '));
    const name = value(KeyConceptName.create('  Scope   rules '));
    expect(theory.value).toBe('First line.\nSecond line explains more.');
    expect(name.value).toBe('Scope rules');
    expect(name.canonicalValue).toBe('scope rules');
    expect(Object.isFrozen(theory)).toBe(true);
  });
  it.each([
    TheoryText.create('short'),
    SummaryText.create('short'),
    ConnectionText.create(' '),
    CommonMistakeText.create('x'),
    ExampleTitle.create(' '),
    ExampleExplanation.create('short'),
    ExampleCode.create(' '),
    KeyConceptName.create(' '),
    TheoryText.create('x'.repeat(20_001)),
    SummaryText.create('x'.repeat(4_001)),
  ])('rejects empty or out-of-range text', (result) => {
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidContentTextError);
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid display order %s',
    (candidate) => {
      const result = DisplayOrder.create(candidate);
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidDisplayOrderError);
    },
  );
  it('compares display order and text by value', () => {
    expect(order(2).equals(order(2))).toBe(true);
    expect(order(1).equals(order(2))).toBe(false);
    expect(value(ExampleTitle.create('Same')).equals(value(ExampleTitle.create('Same')))).toBe(
      true,
    );
  });
});

describe('Content entities and metadata', () => {
  it('keeps entities immutable and preserves identity across text updates', () => {
    const theory = Theory.create(
      TheoryId.create(uuid.generate()),
      value(TheoryText.create('A sufficiently detailed initial theory.')),
    );
    const updated = theory.withText(
      value(TheoryText.create('A sufficiently detailed revised theory.')),
    );
    expect(updated.id.equals(theory.id)).toBe(true);
    expect(theory.text.value).toContain('initial');
    expect(updated.text.value).toContain('revised');
    expect(Object.isFrozen(updated)).toBe(true);
  });
  it('creates manual metadata with bounded values', () => {
    const metadata = value(
      Metadata.create({
        difficulty: 5,
        estimatedReadingMinutes: 60,
        generator: 'Manual',
        language: 'en-US',
        version: 2,
      }),
    );
    expect(metadata).toMatchObject({
      difficulty: 5,
      estimatedReadingMinutes: 60,
      generator: 'Manual',
      language: 'en-US',
      version: 2,
    });
    expect(Object.isFrozen(metadata)).toBe(true);
  });
  it.each([
    { difficulty: 0, estimatedReadingMinutes: 5, generator: 'Manual', language: 'es', version: 1 },
    { difficulty: 1, estimatedReadingMinutes: 0, generator: 'Manual', language: 'es', version: 1 },
    { difficulty: 1, estimatedReadingMinutes: 5, generator: 'Gemini', language: 'es', version: 1 },
    {
      difficulty: 1,
      estimatedReadingMinutes: 5,
      generator: 'Manual',
      language: 'invalid_language!',
      version: 1,
    },
    { difficulty: 1, estimatedReadingMinutes: 5, generator: 'Manual', language: 'es', version: 0 },
  ] as const)('rejects invalid metadata %#', (state) => {
    const result = Metadata.create(state);
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidContentMetadataError);
  });
});

describe('LessonContent aggregate', () => {
  it('creates a complete draft and records LessonContentCreated', () => {
    const base = draft();
    const created = LessonContent.create({
      commonMistakes: base.commonMistakes,
      connectionWithPreviousLesson: base.connectionWithPreviousLesson,
      createdAt: NOW,
      eventId: uuid.generate(),
      examples: base.examples,
      id: ContentId.create(uuid.generate()),
      keyConcepts: base.keyConcepts,
      lessonId: base.lessonId,
      metadata: base.metadata,
      summary: base.summary,
      theory: base.theory,
      updatedAt: NOW,
    });
    expect(created.status).toBe('draft');
    expect(created.aggregateVersion).toBe(1);
    expect(created.pendingDomainEvents[0]?.eventName).toBe('LessonContentCreated');
    expect(created.pendingDomainEvents[0]?.payload.lessonId).toBe(created.lessonId.toString());
  });
  it('updates theory and summary without changing their identities', () => {
    const content = draft();
    const theoryId = content.theory.id;
    const summaryId = content.summary.id;
    expect(
      content.updateTheory(
        value(TheoryText.create('A revised theory with enough meaningful detail.')),
        transition(),
      ).isSuccess,
    ).toBe(true);
    expect(
      content.updateSummary(
        value(SummaryText.create('A revised summary of the lesson content.')),
        transition(),
      ).isSuccess,
    ).toBe(true);
    expect(content.theory.id.equals(theoryId)).toBe(true);
    expect(content.summary.id.equals(summaryId)).toBe(true);
    expect(content.aggregateVersion).toBe(3);
    expect(content.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'TheoryUpdated',
      'SummaryUpdated',
    ]);
  });
  it('adds and orders key concepts and examples with events', () => {
    const content = draft({
      examples: [example('Segundo ejemplo', 2)],
      keyConcepts: [concept('Scope', 2)],
    });
    expect(content.addKeyConcept(concept('Variables', 1), transition()).isSuccess).toBe(true);
    const added = example('Primer ejemplo', 1);
    expect(content.addExample(added, transition()).isSuccess).toBe(true);
    expect(content.keyConcepts.map((item) => item.order.value)).toEqual([1, 2]);
    expect(content.examples.map((item) => item.order.value)).toEqual([1, 2]);
    expect(content.pendingDomainEvents[0]?.payload).toEqual({ displayOrder: 1, name: 'Variables' });
    expect(content.pendingDomainEvents[1]?.payload).toEqual({ exampleId: added.id.toString() });
  });
  it.each([
    () => draft().addKeyConcept(concept(' variables ', 2), transition()),
    () => draft().addKeyConcept(concept('Scope', 1), transition()),
    () => draft().addExample(example('Asignación básica', 2), transition()),
    () => draft().addExample(example('Otro título', 1), transition()),
  ])('rejects duplicate names, titles, and display orders', (execute) => {
    const result = execute();
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(DuplicateContentElementError);
  });
  it('rejects duplicate example identity and no-op text updates', () => {
    const content = draft();
    const duplicateId = example('Otra variante', 2, content.examples[0]!.id);
    const results = [
      content.addExample(duplicateId, transition()),
      content.updateTheory(content.theory.text, transition()),
      content.updateSummary(content.summary.text, transition()),
    ];
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(DuplicateContentElementError);
    }
    expect(content.aggregateVersion).toBe(1);
  });
  it('publishes exactly once, increments version and blocks all later mutations', () => {
    const content = draft();
    expect(content.publish(transition()).isSuccess).toBe(true);
    expect(content.status).toBe('published');
    expect(content.aggregateVersion).toBe(2);
    expect(content.pendingDomainEvents[0]?.eventName).toBe('LessonContentPublished');
    const results = [
      content.publish(transition()),
      content.addKeyConcept(concept('Scope', 2), transition()),
      content.addExample(example('Other example', 2), transition()),
      content.updateTheory(
        value(TheoryText.create('Another complete and valid theory text.')),
        transition(),
      ),
      content.updateSummary(
        value(SummaryText.create('Another valid summary of the material.')),
        transition(),
      ),
    ];
    for (const result of results) {
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(InvalidContentStateError);
    }
  });
  it('defensively copies dates and exposed collections', () => {
    const content = draft();
    const created = content.createdAt;
    created.setUTCFullYear(2030);
    expect(content.createdAt).toEqual(NOW);
    expect(Object.isFrozen(content.examples)).toBe(true);
    expect(Object.isFrozen(content.keyConcepts)).toBe(true);
    expect(Object.isFrozen(content.commonMistakes)).toBe(true);
  });
  it.each([() => draft({ keyConcepts: [] }), () => draft({ examples: [] })])(
    'rejects structurally incomplete rehydration',
    (create) => {
      expect(create).toThrow(IncompleteLessonContentError);
    },
  );
  it.each([
    () => draft({ keyConcepts: [concept('Variables', 1), concept(' variables ', 2)] }),
    () => draft({ keyConcepts: [concept('Variables', 1), concept('Scope', 1)] }),
    () => draft({ examples: [example('One', 1), example(' one ', 2)] }),
    () => draft({ examples: [example('One', 1), example('Two', 1)] }),
    () =>
      draft({
        commonMistakes: [
          value(CommonMistakeText.create('Same mistake')),
          value(CommonMistakeText.create('same mistake')),
        ],
      }),
  ])('rejects duplicate rehydrated children', (create) => {
    expect(create).toThrow(DuplicateContentElementError);
  });
  it('rejects invalid aggregate versions and chronology', () => {
    expect(() => draft({ aggregateVersion: 0 })).toThrow(InvalidContentVersionError);
    expect(() => draft({ updatedAt: new Date(NOW.getTime() - 1) })).toThrow(
      InvalidContentDateError,
    );
    const content = draft();
    expect(() => content.publish(transition(new Date(NOW.getTime() - 1)))).toThrow(
      InvalidContentDateError,
    );
  });
  it('rejects an unknown editorial status during rehydration', () => {
    expect(() => draft({ status: 'invalid' as 'draft' })).toThrow(InvalidContentStateError);
  });
  it('rejects invalid dates at rehydration boundaries', () => {
    expect(() => draft({ createdAt: new Date(Number.NaN) })).toThrow(InvalidContentDateError);
    expect(() => draft({ updatedAt: new Date(Number.NaN) })).toThrow(InvalidContentDateError);
  });
});
