import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { LearningWorkflow } from '../../domain/aggregates/learning-workflow.js';

export interface LearningFlowPolicy {
  canStartWorkflow(studentId: StudentId, curriculumItemId: string): boolean;
  isStepExecutionAllowed(workflow: LearningWorkflow): boolean;
  maxActiveWorkflowsPerStudent(): number;
}
