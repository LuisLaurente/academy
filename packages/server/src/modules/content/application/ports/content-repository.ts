import type { LessonId } from '../../../curriculum/index.js';
import type { LessonContent } from '../../domain/aggregates/lesson-content.js';
import type { ContentId } from '../../domain/identifiers/content-identifiers.js';

export interface ContentRepository {
  findActiveByLessonId(lessonId: LessonId): Promise<LessonContent | undefined>;
  findById(contentId: ContentId): Promise<LessonContent | undefined>;
  save(content: LessonContent): Promise<void>;
}
