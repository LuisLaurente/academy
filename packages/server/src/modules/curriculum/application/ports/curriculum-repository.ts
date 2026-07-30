import type { Topic } from '../../domain/aggregates/topic.js';
import type { TopicId } from '../../domain/identifiers/curriculum-identifiers.js';
import type { TopicName } from '../../domain/value-objects/curriculum-value-objects.js';

export interface CurriculumRepository {
  findById(topicId: TopicId): Promise<Topic | undefined>;
  findByName(name: TopicName): Promise<Topic | undefined>;
  save(topic: Topic): Promise<void>;
}
