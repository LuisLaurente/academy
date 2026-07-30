import type { LearningRepository } from '../../../modules/learning/application/ports/learning-repository.js';
import type { LearningRecord } from '../../../modules/learning/domain/aggregates/learning-record.js';
import type {
  LearningRecordId,
  StudentId,
} from '../../../modules/learning/domain/identifiers/learning-ids.js';
import { InMemoryLearningRepository } from '../../../modules/learning/infrastructure/repositories/in-memory-learning-repository.js';
import type { DatabaseClient } from '../database-client.js';

export class PrismaLearningRepository implements LearningRepository {
  private readonly delegate = new InMemoryLearningRepository();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: LearningRecordId): Promise<LearningRecord | null> {
    return this.delegate.findById(id);
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningRecord[]> {
    return this.delegate.findByStudentId(studentId);
  }

  async save(record: LearningRecord): Promise<void> {
    await this.delegate.save(record);
  }

  async delete(id: LearningRecordId): Promise<void> {
    await this.delegate.delete(id);
  }
}
