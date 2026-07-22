import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { Clock } from '../../core/time/clock.js';
import { LessonId } from '../curriculum/index.js';
import {
  AddExample,
  AddKeyConcept,
  CreateLessonContent,
  PublishLessonContent,
  UpdateSummary,
  UpdateTheory,
} from './application/use-cases/content-use-cases.js';
import {
  DuplicateContentElementError,
  InvalidContentStateError,
  InvalidContentTextError,
  LessonContentAlreadyExistsError,
  LessonContentNotFoundError,
} from './domain/errors/content-errors.js';
import { ContentId } from './domain/identifiers/content-identifiers.js';
import {
  InMemoryContentRepository,
  InMemoryContentUnitOfWork,
} from './infrastructure/testing/in-memory-content.js';

const NOW = new Date('2026-07-21T20:00:00.000Z');
class FixedClock implements Clock {
  now(): Date {
    return new Date(NOW);
  }
}
function fixture() {
  const repository = new InMemoryContentRepository();
  const dependencies = {
    clock: new FixedClock(),
    repository,
    unitOfWork: new InMemoryContentUnitOfWork(),
    uuidService: new CryptoUuidService(),
  };
  return {
    addExample: new AddExample(dependencies),
    addKeyConcept: new AddKeyConcept(dependencies),
    create: new CreateLessonContent(dependencies),
    publish: new PublishLessonContent(dependencies),
    repository,
    updateSummary: new UpdateSummary(dependencies),
    updateTheory: new UpdateTheory(dependencies),
  };
}
function validInput(lessonId = LessonId.create(new CryptoUuidService().generate())) {
  return {
    commonMistakes: ['Confundir asignación con comparación.'],
    connectionWithPreviousLesson: 'Continúa desde los tipos de datos.',
    examples: [
      {
        code: 'age = 42',
        explanation: 'Asigna un número entero a una variable.',
        order: 1,
        title: 'Asignación numérica',
      },
    ],
    keyConcepts: [{ name: 'Asignación', order: 1 }],
    lessonId,
    metadata: { difficulty: 1, estimatedReadingMinutes: 5, language: 'es-PE', version: 1 },
    summary: 'Una variable conserva un valor bajo un nombre.',
    theory: 'Una variable permite asociar un nombre con un valor reutilizable.',
  };
}
async function created(target = fixture()) {
  const result = await target.create.execute(validInput());
  if (!result.isSuccess) throw result.error;
  return { contentId: result.value.contentId, target };
}

describe('Content application use cases', () => {
  it('creates and persists complete manual content', async () => {
    const target = fixture();
    const result = await target.create.execute(validInput());
    expect(result.isSuccess).toBe(true);
    expect(target.repository.size).toBe(1);
    if (!result.isSuccess) return;
    const content = await target.repository.findById(result.value.contentId);
    expect(content?.metadata.generator).toBe('Manual');
    expect(content?.aggregateVersion).toBe(1);
  });
  it('enforces one active content per Lesson atomically', async () => {
    const target = fixture();
    const lessonId = LessonId.create(new CryptoUuidService().generate());
    const results = await Promise.all([
      target.create.execute(validInput(lessonId)),
      target.create.execute(validInput(lessonId)),
    ]);
    expect(results.filter((result) => result.isSuccess)).toHaveLength(1);
    const failure = results.find((result) => !result.isSuccess);
    if (failure?.isSuccess === false)
      expect(failure.error).toBeInstanceOf(LessonContentAlreadyExistsError);
    expect(target.repository.size).toBe(1);
  });
  it.each([
    { patch: { theory: 'short' }, expected: InvalidContentTextError },
    { patch: { summary: 'short' }, expected: InvalidContentTextError },
    { patch: { connectionWithPreviousLesson: '' }, expected: InvalidContentTextError },
    {
      patch: {
        metadata: { difficulty: 0, estimatedReadingMinutes: 5, language: 'es', version: 1 },
      },
      expected: Error,
    },
    { patch: { keyConcepts: [] }, expected: Error },
    { patch: { examples: [] }, expected: Error },
    {
      patch: {
        keyConcepts: [
          { name: 'Same', order: 1 },
          { name: ' same ', order: 2 },
        ],
      },
      expected: DuplicateContentElementError,
    },
    {
      patch: {
        keyConcepts: [
          { name: 'First', order: 1 },
          { name: 'Second', order: 1 },
        ],
      },
      expected: DuplicateContentElementError,
    },
    { patch: { keyConcepts: [{ name: '', order: 1 }] }, expected: InvalidContentTextError },
    { patch: { keyConcepts: [{ name: 'Valid', order: 0 }] }, expected: Error },
    {
      patch: {
        examples: [
          { code: 'x=1', explanation: 'A valid explanation.', order: 1, title: 'Same' },
          { code: 'x=2', explanation: 'Another explanation.', order: 2, title: ' same ' },
        ],
      },
      expected: DuplicateContentElementError,
    },
    {
      patch: {
        examples: [
          { code: 'x=1', explanation: 'A valid explanation.', order: 1, title: 'First' },
          { code: 'x=2', explanation: 'Another explanation.', order: 1, title: 'Second' },
        ],
      },
      expected: DuplicateContentElementError,
    },
    {
      patch: {
        examples: [{ code: '', explanation: 'A valid explanation.', order: 1, title: 'First' }],
      },
      expected: InvalidContentTextError,
    },
    { patch: { commonMistakes: [''] }, expected: InvalidContentTextError },
    {
      patch: { commonMistakes: ['Same mistake', 'same mistake'] },
      expected: DuplicateContentElementError,
    },
  ])('rejects invalid creation input %#', async ({ expected, patch }) => {
    const target = fixture();
    const result = await target.create.execute({ ...validInput(), ...patch });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error).toBeInstanceOf(expected);
    expect(target.repository.size).toBe(0);
  });
  it('allows an empty optional common-mistake collection', async () => {
    const target = fixture();
    const result = await target.create.execute({ ...validInput(), commonMistakes: [] });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect((await target.repository.findById(result.value.contentId))?.commonMistakes).toEqual([]);
  });
  it('updates theory and summary, adds children, and returns versions', async () => {
    const { contentId, target } = await created();
    const theory = await target.updateTheory.execute({
      contentId,
      theory: 'The revised theory introduces assignment with substantially more detail.',
    });
    const concept = await target.addKeyConcept.execute({
      contentId,
      name: 'Reassignment',
      order: 2,
    });
    const added = await target.addExample.execute({
      code: 'age = 43',
      contentId,
      explanation: 'Replaces the previous value with another integer.',
      order: 2,
      title: 'Reassignment example',
    });
    const summary = await target.updateSummary.execute({
      contentId,
      summary: 'Variables support initial assignment and later reassignment.',
    });
    expect([theory, concept, added, summary].every((result) => result.isSuccess)).toBe(true);
    const content = await target.repository.findById(contentId);
    expect(content?.aggregateVersion).toBe(5);
    expect(content?.pendingDomainEvents.map((event) => event.eventName)).toEqual([
      'LessonContentCreated',
      'TheoryUpdated',
      'KeyConceptAdded',
      'ExampleAdded',
      'SummaryUpdated',
    ]);
  });
  it('publishes and persists the immutable state transition', async () => {
    const { contentId, target } = await created();
    const result = await target.publish.execute({ contentId });
    expect(result).toEqual({ isSuccess: true, value: { version: 2 } });
    expect((await target.repository.findById(contentId))?.status).toBe('published');
    const retry = await target.publish.execute({ contentId });
    expect(retry.isSuccess).toBe(false);
    if (!retry.isSuccess) expect(retry.error).toBeInstanceOf(InvalidContentStateError);
  });
  it.each(['theory', 'summary', 'concept', 'example', 'publish'] as const)(
    'returns not-found from %s without throwing',
    async (operation) => {
      const target = fixture();
      const contentId = ContentId.create(new CryptoUuidService().generate());
      const calls = {
        theory: () =>
          target.updateTheory.execute({
            contentId,
            theory: 'A sufficiently long replacement theory value.',
          }),
        summary: () =>
          target.updateSummary.execute({
            contentId,
            summary: 'A sufficiently long replacement summary.',
          }),
        concept: () => target.addKeyConcept.execute({ contentId, name: 'Scope', order: 2 }),
        example: () =>
          target.addExample.execute({
            code: 'x = 1',
            contentId,
            explanation: 'A sufficiently long explanation.',
            order: 2,
            title: 'Example',
          }),
        publish: () => target.publish.execute({ contentId }),
      };
      const result = await calls[operation]();
      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) expect(result.error).toBeInstanceOf(LessonContentNotFoundError);
    },
  );
  it('validates mutation commands before repository access', async () => {
    const target = fixture();
    const contentId = ContentId.create(new CryptoUuidService().generate());
    const results = await Promise.all([
      target.updateTheory.execute({ contentId, theory: '' }),
      target.updateSummary.execute({ contentId, summary: '' }),
      target.addKeyConcept.execute({ contentId, name: '', order: 0 }),
      target.addExample.execute({ code: '', contentId, explanation: '', order: 0, title: '' }),
    ]);
    expect(results.every((result) => !result.isSuccess)).toBe(true);
  });
  it('rejects duplicate additions without persisting a version change', async () => {
    const { contentId, target } = await created();
    const duplicateConcept = await target.addKeyConcept.execute({
      contentId,
      name: ' asignación ',
      order: 2,
    });
    const duplicateExample = await target.addExample.execute({
      code: 'age=1',
      contentId,
      explanation: 'A different but sufficient explanation.',
      order: 2,
      title: ' asignación numérica ',
    });
    expect(duplicateConcept.isSuccess).toBe(false);
    expect(duplicateExample.isSuccess).toBe(false);
    expect((await target.repository.findById(contentId))?.aggregateVersion).toBe(1);
  });
});

describe('in-memory Content infrastructure', () => {
  it('resolves content by aggregate and Lesson identities', async () => {
    const target = fixture();
    const input = validInput();
    const result = await target.create.execute(input);
    if (!result.isSuccess) throw result.error;
    expect(
      (await target.repository.findById(result.value.contentId))?.id.equals(result.value.contentId),
    ).toBe(true);
    expect(
      (await target.repository.findActiveByLessonId(input.lessonId))?.id.equals(
        result.value.contentId,
      ),
    ).toBe(true);
  });
  it('continues serializing work after a rejected callback', async () => {
    const work = new InMemoryContentUnitOfWork();
    const execution: string[] = [];
    const first = work.execute(async () => {
      execution.push('first');
      throw new Error('expected');
    });
    const second = work.execute(() => {
      execution.push('second');
      return Promise.resolve(2);
    });
    await expect(first).rejects.toThrow('expected');
    await expect(second).resolves.toBe(2);
    expect(execution).toEqual(['first', 'second']);
  });
});
