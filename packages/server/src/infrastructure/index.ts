// Database & Unit of Work
export type { DatabaseClient, DatabaseTransactionClient } from './database/database-client.js';
export { DatabaseUnitOfWork, type UnitOfWork } from './database/unit-of-work.js';

// Repositories
export {
  PrismaContentRepository,
  type ContentBlockRecord,
  type ContentRepository,
} from './database/repositories/prisma-content-repository.js';
export {
  PrismaCurriculumRepository,
  type CurriculumItemRecord,
  type CurriculumRepository,
} from './database/repositories/prisma-curriculum-repository.js';
export {
  PrismaEvaluationRepository,
  type EvaluationRecordData,
  type EvaluationRepository,
} from './database/repositories/prisma-evaluation-repository.js';
export {
  PrismaExerciseRepository,
  type ExerciseRecord,
  type ExerciseRepository,
} from './database/repositories/prisma-exercise-repository.js';
export { PrismaGenerationRepository } from './database/repositories/prisma-generation-repository.js';
export { PrismaLearningRepository } from './database/repositories/prisma-learning-repository.js';
export { PrismaRecommendationRepository } from './database/repositories/prisma-recommendation-repository.js';
export { PrismaSessionRepository } from './database/repositories/prisma-session-repository.js';
export {
  PrismaUserRepository,
  type RawUserData,
} from './database/repositories/prisma-user-repository.js';
export { PrismaWorkflowRepository } from './database/repositories/prisma-workflow-repository.js';

// Queue Infrastructure
export { BullMQJobQueueAdapter, type BullMQClientLike } from './queue/bullmq-job-queue-adapter.js';
export { InMemoryJobQueue } from './queue/in-memory-job-queue.js';
export type { JobOptions, JobProcessor, JobQueue, JobStatus, QueueJob } from './queue/job-queue.js';

// Storage Infrastructure
export type { ArtifactFile, ArtifactStorage } from './storage/artifact-storage.js';
export { InMemoryArtifactStorage } from './storage/in-memory-artifact-storage.js';
export {
  S3ArtifactStorageAdapter,
  type S3ClientLike,
} from './storage/s3-artifact-storage-adapter.js';
