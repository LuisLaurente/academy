import type { Uuid } from '../../../../core/identifiers/uuid-service.js';
import { EntityId } from '../../../../domain/identity/entity-id.js';

export class ApplicationFlowId extends EntityId<'LearningWorkflow'> {
  static create(value: Uuid): ApplicationFlowId {
    return new ApplicationFlowId(value);
  }
}

export class WorkflowExecutionId extends EntityId<'WorkflowStepExecution'> {
  static create(value: Uuid): WorkflowExecutionId {
    return new WorkflowExecutionId(value);
  }
}

export class WorkflowResultId extends EntityId<'WorkflowResult'> {
  static create(value: Uuid): WorkflowResultId {
    return new WorkflowResultId(value);
  }
}
