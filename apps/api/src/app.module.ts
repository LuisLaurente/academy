import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  AdministrationModule,
  AiContentModule,
  AnalyticsModule,
  ContentModule,
  CurriculumModule,
  EvaluationModule,
  GamificationModule,
  IdentityAccessModule,
  MasteryModule,
  NotificationsModule,
  PracticeModule,
  ReviewModule,
  StudyActivityModule,
  UserProfileModule,
} from '@learning-os/server';
import { validateApiEnvironment } from '@learning-os/configuration';

import { CacheInfrastructureModule } from './infrastructure/cache/cache-infrastructure.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueInfrastructureModule } from './infrastructure/queue/queue-infrastructure.module';
import { AllExceptionsFilter } from './platform/errors/all-exceptions.filter';
import { CorrelationInterceptor } from './platform/observability/correlation.interceptor';
import { RequestLoggingInterceptor } from './platform/observability/request-logging.interceptor';
import { HealthModule } from './platform/health/health.module';

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
    IdentityAccessModule,
    UserProfileModule,
    CurriculumModule,
    ContentModule,
    PracticeModule,
    EvaluationModule,
    MasteryModule,
    ReviewModule,
    AiContentModule,
    StudyActivityModule,
    AnalyticsModule,
    GamificationModule,
    NotificationsModule,
    AdministrationModule,
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
