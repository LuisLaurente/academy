import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { LearningWorkflow } from '../../domain/aggregates/learning-workflow.js';
import type { ApplicationFlowId } from '../../domain/identifiers/application-ids.js';

export interface WorkflowRepository {
  delete(id: ApplicationFlowId): Promise<void>;
  findActiveByStudentId(studentId: StudentId): Promise<LearningWorkflow | null>;
  findById(id: ApplicationFlowId): Promise<LearningWorkflow | null>;
  findByStudentId(studentId: StudentId): Promise<readonly LearningWorkflow[]>;
  save(workflow: LearningWorkflow): Promise<void>;
}
