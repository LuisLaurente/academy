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
import { PrismaService } from './prisma.service';

const repositories = [
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
  CryptoUuidService,
];

@Global()
@Module({
  exports: [PrismaService, ...repositories],
  providers: [PrismaService, ...repositories],
})
export class DatabaseModule {}
