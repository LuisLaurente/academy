import type { StudentId } from '../../../modules/learning/domain/identifiers/learning-ids.js';
import type { WorkflowRepository } from '../../../modules/application/application/ports/workflow-repository.js';
import type { LearningWorkflow } from '../../../modules/application/domain/aggregates/learning-workflow.js';
import type { ApplicationFlowId } from '../../../modules/application/domain/identifiers/application-ids.js';
import { InMemoryWorkflowRepository } from '../../../modules/application/infrastructure/repositories/in-memory-workflow-repository.js';
import type { DatabaseClient } from '../database-client.js';

export class PrismaWorkflowRepository implements WorkflowRepository {
  private readonly delegate = new InMemoryWorkflowRepository();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: ApplicationFlowId): Promise<LearningWorkflow | null> {
    return this.delegate.findById(id);
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningWorkflow[]> {
    return this.delegate.findByStudentId(studentId);
  }

  async findActiveByStudentId(studentId: StudentId): Promise<LearningWorkflow | null> {
    return this.delegate.findActiveByStudentId(studentId);
  }

  async save(workflow: LearningWorkflow): Promise<void> {
    await this.delegate.save(workflow);
  }

  async delete(id: ApplicationFlowId): Promise<void> {
    await this.delegate.delete(id);
  }
}
