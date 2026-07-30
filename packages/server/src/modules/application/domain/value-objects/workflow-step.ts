import { Result, type Result as ResultType } from '../../../../core/result/result.js';
import { ValueObject } from '../../../../core/value-objects/value-object.js';
import { InvalidWorkflowValueError } from '../errors/application-errors.js';

export type StepName =
  | 'curriculum_selection'
  | 'content_retrieval'
  | 'exercise_assembly'
  | 'session_execution'
  | 'evaluation_processing'
  | 'learning_record_update'
  | 'recommendation_generation'
  | 'ai_orchestration_sync'
  | 'completed';

const STEP_SEQUENCE: readonly StepName[] = [
  'curriculum_selection',
  'content_retrieval',
  'exercise_assembly',
  'session_execution',
  'evaluation_processing',
  'learning_record_update',
  'recommendation_generation',
  'ai_orchestration_sync',
  'completed',
];

export class WorkflowStep extends ValueObject {
  readonly name: StepName;
  readonly sequenceIndex: number;

  private constructor(name: StepName) {
    super();
    this.name = name;
    this.sequenceIndex = STEP_SEQUENCE.indexOf(name);
    Object.freeze(this);
  }

  static create(candidate: string): ResultType<WorkflowStep, InvalidWorkflowValueError> {
    const normalized = candidate.toLowerCase() as StepName;
    if (!STEP_SEQUENCE.includes(normalized)) {
      return Result.failure(new InvalidWorkflowValueError('workflowStep', candidate));
    }

    return Result.success(new WorkflowStep(normalized));
  }

  static initial(): WorkflowStep {
    return new WorkflowStep('curriculum_selection');
  }

  static completed(): WorkflowStep {
    return new WorkflowStep('completed');
  }

  next(): WorkflowStep {
    if (this.sequenceIndex < 0 || this.sequenceIndex >= STEP_SEQUENCE.length - 1) {
      return WorkflowStep.completed();
    }
    const nextStep = STEP_SEQUENCE[this.sequenceIndex + 1];
    return new WorkflowStep(nextStep ?? 'completed');
  }

  override toString(): string {
    return this.name;
  }

  protected getEqualityComponents(): readonly (string | number)[] {
    return [this.name, this.sequenceIndex];
  }
}
