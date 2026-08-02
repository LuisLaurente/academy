import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { validateApiEnvironment } from '@learning-os/configuration';

import { CacheInfrastructureModule } from './infrastructure/cache/cache-infrastructure.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueInfrastructureModule } from './infrastructure/queue/queue-infrastructure.module';
import { AIOrchestrationModule } from './modules/ai-orchestration/ai-orchestration.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ExerciseModule } from './modules/exercises/exercise.module';
import { LearningModule } from './modules/learning/learning.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { SessionModule } from './modules/session/session.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PracticeModule } from './modules/practice/practice.module';
import { AllExceptionsFilter } from './platform/errors/all-exceptions.filter';

import { HealthModule } from './platform/health/health.module';
import { CorrelationInterceptor } from './platform/observability/correlation.interceptor';
import { RequestLoggingInterceptor } from './platform/observability/request-logging.interceptor';

const environment = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: [`.env.${environment}`, '.env', `../../.env.${environment}`, '../../.env'],
      isGlobal: true,
      validate: validateApiEnvironment,
    }),
    DatabaseModule,
    CacheInfrastructureModule,
    QueueInfrastructureModule,
    HealthModule,
    AuthModule,
    CurriculumModule,
    ContentModule,
    ExerciseModule,
    EvaluationModule,
    LearningModule,
    RecommendationModule,
    SessionModule,
    AIOrchestrationModule,
    WorkflowModule,
    SettingsModule,
    PracticeModule,
  ],

  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          forbidNonWhitelisted: true,
          transform: true,
          whitelist: true,
        }),
    },
  ],
})
export class AppModule {}
