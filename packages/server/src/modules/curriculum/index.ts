export type {
  AddConceptInput,
  AddConceptOutput,
  AddLessonInput,
  AddLessonOutput,
  AddLevelInput,
  AddLevelOutput,
  AddSublevelInput,
  AddSublevelOutput,
  CreateTopicInput,
  CreateTopicOutput,
} from './application/dtos/curriculum-commands.js';
export type { CurriculumRepository } from './application/ports/curriculum-repository.js';
export {
  AddConcept,
  AddLesson,
  AddLevel,
  AddSublevel,
  CreateTopic,
} from './application/use-cases/curriculum-use-cases.js';
export {
  Concept,
  Lesson,
  Level,
  Sublevel,
  Topic,
  type TopicStatus,
} from './domain/aggregates/topic.js';
export {
  CurriculumElementNotFoundError,
  CurriculumError,
  DuplicateCurriculumElementError,
  IncompleteCurriculumHierarchyError,
  InvalidCurriculumDateError,
  InvalidCurriculumStateError,
  InvalidCurriculumTextError,
  InvalidDifficultyLevelError,
  InvalidLearningOrderError,
} from './domain/errors/curriculum-errors.js';
export {
  ConceptAdded,
  LessonAdded,
  LevelAdded,
  SublevelAdded,
  TopicCreated,
} from './domain/events/curriculum-events.js';
export {
  ConceptId,
  LessonId,
  LevelId,
  SublevelId,
  TopicId,
} from './domain/identifiers/curriculum-identifiers.js';
export {
  ConceptName,
  DifficultyLevel,
  type DifficultyLevelValue,
  LearningOrder,
  LessonTitle,
  TopicDescription,
  TopicName,
} from './domain/value-objects/curriculum-value-objects.js';
export { CurriculumItemId } from './domain/identifiers/curriculum-ids.js';
