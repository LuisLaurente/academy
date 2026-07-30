import { Global, Module } from '@nestjs/common';
import { CryptoUuidService } from '@learning-os/server/core';
import {
  PrismaContentRepository,
  PrismaCurriculumRepository,
  PrismaEvaluationRepository,
  PrismaExerciseRepository,
  PrismaGenerationRepository,
  PrismaLearningRepository,
  PrismaRecommendationRepository,
  PrismaSessionRepository,
  PrismaUserRepository,
  PrismaWorkflowRepository,
} from '@learning-os/server/infrastructure';
import type { DatabaseClient } from '@learning-os/server/infrastructure';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    CryptoUuidService,
    {
      provide: PrismaUserRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaUserRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaCurriculumRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaCurriculumRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaContentRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaContentRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaExerciseRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaExerciseRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaEvaluationRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaEvaluationRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaLearningRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaLearningRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaRecommendationRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaRecommendationRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaSessionRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaSessionRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaGenerationRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaGenerationRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
    {
      provide: PrismaWorkflowRepository,
      useFactory: (prisma: PrismaService) =>
        new PrismaWorkflowRepository(prisma as unknown as DatabaseClient),
      inject: [PrismaService],
    },
  ],
  exports: [
    PrismaService,
    CryptoUuidService,
    PrismaUserRepository,
    PrismaCurriculumRepository,
    PrismaContentRepository,
    PrismaExerciseRepository,
    PrismaEvaluationRepository,
    PrismaLearningRepository,
    PrismaRecommendationRepository,
    PrismaSessionRepository,
    PrismaGenerationRepository,
    PrismaWorkflowRepository,
  ],
})
export class DatabaseModule {}
