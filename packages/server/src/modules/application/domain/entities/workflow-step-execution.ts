import { Entity } from '../../../../domain/entities/entity.js';
import type { WorkflowExecutionId } from '../identifiers/application-ids.js';
import type { ExecutionDuration } from '../value-objects/execution-duration.js';
import type { WorkflowStep } from '../value-objects/workflow-step.js';

export type StepExecutionStatus = 'pending' | 'success' | 'failed';

export interface CreateWorkflowStepExecutionProps {
  readonly completedAt?: Date | null;
  readonly duration?: ExecutionDuration | null;
  readonly errorMessage?: string | null;
  readonly id: WorkflowExecutionId;
  readonly startedAt?: Date;
  readonly status?: StepExecutionStatus;
  readonly step: WorkflowStep;
}

export class WorkflowStepExecution extends Entity<WorkflowExecutionId> {
  readonly step: WorkflowStep;
  readonly startedAt: Date;

  private _status: StepExecutionStatus;
  private _completedAt: Date | null;
  private _duration: ExecutionDuration | null;
  private _errorMessage: string | null;

  private constructor(props: CreateWorkflowStepExecutionProps) {
    super(props.id);
    this.step = props.step;
    this.startedAt = props.startedAt ?? new Date();
    this._status = props.status ?? 'pending';
    this._completedAt = props.completedAt ?? null;
    this._duration = props.duration ?? null;
    this._errorMessage = props.errorMessage ?? null;
  }

  static create(props: CreateWorkflowStepExecutionProps): WorkflowStepExecution {
    return new WorkflowStepExecution(props);
  }

  get status(): StepExecutionStatus {
    return this._status;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get duration(): ExecutionDuration | null {
    return this._duration;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  complete(duration: ExecutionDuration, now = new Date()): void {
    this._status = 'success';
    this._completedAt = now;
    this._duration = duration;
  }

  fail(reason: string, duration: ExecutionDuration, now = new Date()): void {
    this._status = 'failed';
    this._completedAt = now;
    this._duration = duration;
    this._errorMessage = reason;
  }
}
