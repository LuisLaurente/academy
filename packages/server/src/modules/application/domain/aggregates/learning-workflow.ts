import type { DomainError } from '../../../../core/errors/domain-error.js';
import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { AggregateRoot } from '../../../../domain/aggregates/aggregate-root.js';
import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionId } from '../../../session/domain/identifiers/session-ids.js';
import type { WorkflowResult } from '../entities/workflow-result.js';
import type { WorkflowStepExecution } from '../entities/workflow-step-execution.js';
import {
  InvalidWorkflowTransitionError,
  WorkflowAlreadyCompletedError,
} from '../errors/application-errors.js';
import {
  WorkflowCompleted,
  WorkflowFailed,
  WorkflowStarted,
  WorkflowStepCompleted,
} from '../events/application-events.js';
import type { ApplicationFlowId } from '../identifiers/application-ids.js';
import { ExecutionDuration } from '../value-objects/execution-duration.js';
import { WorkflowStatus } from '../value-objects/workflow-status.js';
import { WorkflowStep } from '../value-objects/workflow-step.js';

export interface StartLearningWorkflowProps {
  readonly completedAt?: Date | null;
  readonly createdAt?: Date;
  readonly curriculumItemId: string;
  readonly currentStep?: WorkflowStep;
  readonly eventId?: Uuid;
  readonly id: ApplicationFlowId;
  readonly sessionId?: SessionId | null;
  readonly startedAt?: Date;
  readonly studentId: StudentId;
  readonly updatedAt?: Date;
  readonly workflowStatus?: WorkflowStatus;
}

export interface LearningWorkflowTimestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class LearningWorkflow extends AggregateRoot<ApplicationFlowId> {
  readonly studentId: StudentId;
  readonly curriculumItemId: string;
  readonly startedAt: Date;

  private _sessionId: SessionId | null;
  private _currentStep: WorkflowStep;
  private _workflowStatus: WorkflowStatus;
  private _completedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _stepExecutions: WorkflowStepExecution[] = [];
  private _result: WorkflowResult | null = null;

  private constructor(props: StartLearningWorkflowProps) {
    super(props.id);
    this.studentId = props.studentId;
    this.curriculumItemId = props.curriculumItemId;
    this.startedAt = props.startedAt ?? new Date();
    this._sessionId = props.sessionId ?? null;
    this._currentStep = props.currentStep ?? WorkflowStep.initial();
    this._workflowStatus = props.workflowStatus ?? WorkflowStatus.running();
    this._completedAt = props.completedAt ?? null;
    this._createdAt = props.createdAt ?? this.startedAt;
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static start(props: StartLearningWorkflowProps): LearningWorkflow {
    const workflow = new LearningWorkflow(props);

    if (props.eventId) {
      workflow.recordDomainEvent(
        new WorkflowStarted({
          aggregateId: workflow.id,
          aggregateVersion: 1,
          curriculumItemId: workflow.curriculumItemId,
          eventId: props.eventId,
          occurredAt: workflow.startedAt,
          startedAt: workflow.startedAt,
          studentId: workflow.studentId,
        }),
      );
    }

    return workflow;
  }

  get sessionId(): SessionId | null {
    return this._sessionId;
  }

  get currentStep(): WorkflowStep {
    return this._currentStep;
  }

  get workflowStatus(): WorkflowStatus {
    return this._workflowStatus;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get result(): WorkflowResult | null {
    return this._result;
  }

  get stepExecutions(): readonly WorkflowStepExecution[] {
    return Object.freeze([...this._stepExecutions]);
  }

  get timestamps(): LearningWorkflowTimestamps {
    return Object.freeze({
      createdAt: new Date(this._createdAt.getTime()),
      updatedAt: new Date(this._updatedAt.getTime()),
    });
  }

  attachSession(sessionId: SessionId): void {
    this._sessionId = sessionId;
    this._updatedAt = new Date();
  }

  executeStep(
    execution: WorkflowStepExecution,
    eventId?: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this._workflowStatus.isTerminal) {
      return Result.failure(new WorkflowAlreadyCompletedError(this.id.toString()));
    }

    const durationRes = ExecutionDuration.between(execution.startedAt, now);
    const duration = durationRes.isSuccess ? durationRes.value : ExecutionDuration.zero();
    execution.complete(duration, now);
    this._stepExecutions.push(execution);

    this._currentStep = this._currentStep.next();
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new WorkflowStepCompleted({
          aggregateId: this.id,
          aggregateVersion: 1,
          durationMs: execution.duration?.durationMs ?? 0,
          eventId,
          occurredAt: now,
          stepName: execution.step.name,
          studentId: this.studentId,
        }),
      );
    }

    return Result.success(undefined);
  }

  complete(
    result: WorkflowResult,
    eventId?: Uuid,
    now = new Date(),
  ): ResultType<void, DomainError> {
    if (this._workflowStatus.isTerminal) {
      return Result.failure(new WorkflowAlreadyCompletedError(this.id.toString()));
    }

    this._workflowStatus = WorkflowStatus.completed();
    this._currentStep = WorkflowStep.completed();
    this._completedAt = now;
    this._updatedAt = now;
    this._result = result;

    if (eventId) {
      this.recordDomainEvent(
        new WorkflowCompleted({
          aggregateId: this.id,
          aggregateVersion: 1,
          completedAt: now,
          eventId,
          executedStepsCount: this._stepExecutions.length,
          occurredAt: now,
          sessionId: this._sessionId?.toString() ?? null,
          studentId: this.studentId,
          totalDurationMs: result.totalDuration.durationMs,
        }),
      );
    }

    return Result.success(undefined);
  }

  fail(reason: string, eventId?: Uuid, now = new Date()): ResultType<void, DomainError> {
    if (this._workflowStatus.isTerminal) {
      return Result.failure(new WorkflowAlreadyCompletedError(this.id.toString()));
    }

    const failedStepName = this._currentStep.name;
    this._workflowStatus = WorkflowStatus.failed();
    this._completedAt = now;
    this._updatedAt = now;

    if (eventId) {
      this.recordDomainEvent(
        new WorkflowFailed({
          aggregateId: this.id,
          aggregateVersion: 1,
          eventId,
          failedAt: now,
          failedStepName,
          occurredAt: now,
          reason,
          studentId: this.studentId,
        }),
      );
    }

    return Result.success(undefined);
  }

  cancel(now = new Date()): ResultType<void, DomainError> {
    if (this._workflowStatus.isTerminal) {
      return Result.failure(
        new InvalidWorkflowTransitionError('Cannot cancel a completed/failed workflow'),
      );
    }

    this._workflowStatus = WorkflowStatus.cancelled();
    this._completedAt = now;
    this._updatedAt = now;

    return Result.success(undefined);
  }
}
