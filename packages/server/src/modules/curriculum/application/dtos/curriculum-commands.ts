import type {
  ConceptId,
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from '../../domain/identifiers/curriculum-identifiers.js';

export interface CreateTopicInput {
  readonly description: string;
  readonly name: string;
}

export interface CreateTopicOutput {
  readonly topicId: TopicId;
}

export interface AddLevelInput {
  readonly difficulty: number;
  readonly name: string;
  readonly order: number;
  readonly topicId: TopicId;
}

export interface AddLevelOutput {
  readonly levelId: LevelId;
}

export interface AddSublevelInput {
  readonly difficulty: number;
  readonly levelId: LevelId;
  readonly name: string;
  readonly order: number;
  readonly topicId: TopicId;
}

export interface AddSublevelOutput {
  readonly sublevelId: SublevelId;
}

export interface AddLessonInput {
  readonly order: number;
  readonly sublevelId: SublevelId;
  readonly title: string;
  readonly topicId: TopicId;
}

export interface AddLessonOutput {
  readonly lessonId: LessonId;
}

export interface AddConceptInput {
  readonly difficulty: number;
  readonly lessonId: LessonId;
  readonly name: string;
  readonly order: number;
  readonly topicId: TopicId;
}

export interface AddConceptOutput {
  readonly conceptId: ConceptId;
}
