import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { DomainEvent, type DomainEventMetadata } from '../../../../domain/events/domain-event.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { ApplicationFlowId } from '../identifiers/application-ids.js';

export interface WorkflowEventEnvelope {
  readonly aggregateId: ApplicationFlowId;
  readonly aggregateVersion: number;
  readonly eventId: Uuid;
  readonly metadata?: DomainEventMetadata;
  readonly occurredAt: Date;
}

export class WorkflowStarted extends DomainEvent<ApplicationFlowId, 'WorkflowStarted'> {
  constructor(
    options: WorkflowEventEnvelope & {
      readonly curriculumItemId: string;
      readonly startedAt: Date;
      readonly studentId: StudentId;
    },
  ) {
    const { curriculumItemId, startedAt, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningWorkflow',
      eventName: 'WorkflowStarted',
      eventVersion: 1,
      payload: {
        curriculumItemId,
        startedAt: startedAt.toISOString(),
        studentId: studentId.toString(),
      },
    });
  }
}

export class WorkflowStepCompleted extends DomainEvent<ApplicationFlowId, 'WorkflowStepCompleted'> {
  constructor(
    options: WorkflowEventEnvelope & {
      readonly durationMs: number;
      readonly stepName: string;
      readonly studentId: StudentId;
    },
  ) {
    const { durationMs, stepName, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningWorkflow',
      eventName: 'WorkflowStepCompleted',
      eventVersion: 1,
      payload: {
        durationMs,
        stepName,
        studentId: studentId.toString(),
      },
    });
  }
}

export class WorkflowCompleted extends DomainEvent<ApplicationFlowId, 'WorkflowCompleted'> {
  constructor(
    options: WorkflowEventEnvelope & {
      readonly completedAt: Date;
      readonly executedStepsCount: number;
      readonly sessionId?: string | null;
      readonly studentId: StudentId;
      readonly totalDurationMs: number;
    },
  ) {
    const { completedAt, executedStepsCount, sessionId, studentId, totalDurationMs, ...envelope } =
      options;
    super({
      ...envelope,
      aggregateType: 'LearningWorkflow',
      eventName: 'WorkflowCompleted',
      eventVersion: 1,
      payload: {
        completedAt: completedAt.toISOString(),
        executedStepsCount,
        sessionId: sessionId ?? null,
        studentId: studentId.toString(),
        totalDurationMs,
      },
    });
  }
}

export class WorkflowFailed extends DomainEvent<ApplicationFlowId, 'WorkflowFailed'> {
  constructor(
    options: WorkflowEventEnvelope & {
      readonly failedAt: Date;
      readonly failedStepName: string;
      readonly reason: string;
      readonly studentId: StudentId;
    },
  ) {
    const { failedAt, failedStepName, reason, studentId, ...envelope } = options;
    super({
      ...envelope,
      aggregateType: 'LearningWorkflow',
      eventName: 'WorkflowFailed',
      eventVersion: 1,
      payload: {
        failedAt: failedAt.toISOString(),
        failedStepName,
        reason,
        studentId: studentId.toString(),
      },
    });
  }
}
