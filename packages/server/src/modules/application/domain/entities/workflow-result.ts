import { Entity } from '../../../../domain/entities/entity.js';
import type { WorkflowResultId } from '../identifiers/application-ids.js';
import type { ExecutionDuration } from '../value-objects/execution-duration.js';

export interface CreateWorkflowResultProps {
  readonly completedAt: Date;
  readonly executedStepsCount: number;
  readonly id: WorkflowResultId;
  readonly summary: string;
  readonly totalDuration: ExecutionDuration;
}

export class WorkflowResult extends Entity<WorkflowResultId> {
  readonly summary: string;
  readonly executedStepsCount: number;
  readonly totalDuration: ExecutionDuration;
  readonly completedAt: Date;

  private constructor(props: CreateWorkflowResultProps) {
    super(props.id);
    this.summary = props.summary;
    this.executedStepsCount = props.executedStepsCount;
    this.totalDuration = props.totalDuration;
    this.completedAt = props.completedAt;
    Object.freeze(this);
  }

  static create(props: CreateWorkflowResultProps): WorkflowResult {
    return new WorkflowResult(props);
  }
}
