import type { LessonId } from '../../../curriculum/index.js';
import type { ContentId, ExampleId } from '../../domain/identifiers/content-identifiers.js';

export interface KeyConceptInput {
  readonly name: string;
  readonly order: number;
}
export interface ExampleInput {
  readonly code: string;
  readonly explanation: string;
  readonly order: number;
  readonly title: string;
}
export interface ContentMetadataInput {
  readonly difficulty: number;
  readonly estimatedReadingMinutes: number;
  readonly language: string;
  readonly version: number;
}
export interface CreateLessonContentInput {
  readonly commonMistakes?: readonly string[];
  readonly connectionWithPreviousLesson: string;
  readonly examples: readonly ExampleInput[];
  readonly keyConcepts: readonly KeyConceptInput[];
  readonly lessonId: LessonId;
  readonly metadata: ContentMetadataInput;
  readonly summary: string;
  readonly theory: string;
}
export interface CreateLessonContentOutput {
  readonly contentId: ContentId;
  readonly version: number;
}
export interface UpdateTheoryInput {
  readonly contentId: ContentId;
  readonly theory: string;
}
export interface AddKeyConceptInput extends KeyConceptInput {
  readonly contentId: ContentId;
}
export interface AddExampleInput extends ExampleInput {
  readonly contentId: ContentId;
}
export interface AddExampleOutput {
  readonly exampleId: ExampleId;
  readonly version: number;
}
export interface UpdateSummaryInput {
  readonly contentId: ContentId;
  readonly summary: string;
}
export interface PublishLessonContentInput {
  readonly contentId: ContentId;
}
export interface ContentVersionOutput {
  readonly version: number;
}
