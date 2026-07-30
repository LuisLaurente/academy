import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidWorkflowValueError } from '../errors/application-errors.js';

export type WorkflowStatusState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

const VALID_STATUSES: ReadonlySet<WorkflowStatusState> = new Set([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export class WorkflowStatus extends ValueObject {
  readonly state: WorkflowStatusState;

  private constructor(state: WorkflowStatusState) {
    super();
    this.state = state;
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<WorkflowStatus, InvalidWorkflowValueError> {
    const normalized = candidate.toLowerCase() as WorkflowStatusState;
    if (!VALID_STATUSES.has(normalized)) {
      return Result.failure(new InvalidWorkflowValueError('workflowStatus', candidate));
    }

    return Result.success(new WorkflowStatus(normalized));
  }

  static pending(): WorkflowStatus {
    return new WorkflowStatus('pending');
  }

  static running(): WorkflowStatus {
    return new WorkflowStatus('running');
  }

  static completed(): WorkflowStatus {
    return new WorkflowStatus('completed');
  }

  static failed(): WorkflowStatus {
    return new WorkflowStatus('failed');
  }

  static cancelled(): WorkflowStatus {
    return new WorkflowStatus('cancelled');
  }

  get isTerminal(): boolean {
    return this.state === 'completed' || this.state === 'failed' || this.state === 'cancelled';
  }

  override toString(): string {
    return this.state;
  }

  protected getEqualityComponents(): readonly string[] {
    return [this.state];
  }
}
