import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type { LessonId } from '../../../curriculum/index.js';
import type { ContentRepository } from '../../application/ports/content-repository.js';
import type { LessonContent } from '../../domain/aggregates/lesson-content.js';
import type { ContentId } from '../../domain/identifiers/content-identifiers.js';

export class InMemoryContentRepository implements ContentRepository {
  readonly #contents = new Map<string, LessonContent>();
  readonly #activeByLesson = new Map<string, string>();
  findActiveByLessonId(lessonId: LessonId): Promise<LessonContent | undefined> {
    const id = this.#activeByLesson.get(lessonId.toString());
    return Promise.resolve(id ? this.#contents.get(id) : undefined);
  }
  findById(contentId: ContentId): Promise<LessonContent | undefined> {
    return Promise.resolve(this.#contents.get(contentId.toString()));
  }
  save(content: LessonContent): Promise<void> {
    const id = content.id.toString();
    this.#contents.set(id, content);
    this.#activeByLesson.set(content.lessonId.toString(), id);
    return Promise.resolve();
  }
  get size(): number {
    return this.#contents.size;
  }
}

export class InMemoryContentUnitOfWork implements UnitOfWork {
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
