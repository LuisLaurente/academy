import type { UnitOfWork } from '../../../../domain/transactions/unit-of-work.js';
import type { CurriculumRepository } from '../../application/ports/curriculum-repository.js';
import type { Topic } from '../../domain/aggregates/topic.js';
import type { TopicId } from '../../domain/identifiers/curriculum-identifiers.js';
import type { TopicName } from '../../domain/value-objects/curriculum-value-objects.js';

export class InMemoryCurriculumRepository implements CurriculumRepository {
  readonly #topicsById = new Map<string, Topic>();
  readonly #topicIdsByName = new Map<string, string>();

  findById(topicId: TopicId): Promise<Topic | undefined> {
    return Promise.resolve(this.#topicsById.get(topicId.toString()));
  }

  findByName(name: TopicName): Promise<Topic | undefined> {
    const topicId = this.#topicIdsByName.get(name.canonicalValue);
    return Promise.resolve(topicId === undefined ? undefined : this.#topicsById.get(topicId));
  }

  save(topic: Topic): Promise<void> {
    const topicId = topic.id.toString();
    this.#topicsById.set(topicId, topic);
    this.#topicIdsByName.set(topic.name.canonicalValue, topicId);
    return Promise.resolve();
  }

  get size(): number {
    return this.#topicsById.size;
  }
}

export class InMemoryCurriculumUnitOfWork implements UnitOfWork {
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
