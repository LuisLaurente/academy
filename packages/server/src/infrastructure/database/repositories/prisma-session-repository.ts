import type { StudentId } from '../../../modules/learning/domain/identifiers/learning-ids.js';
import type { SessionRepository } from '../../../modules/session/application/ports/session-repository.js';
import type { LearningSession } from '../../../modules/session/domain/aggregates/learning-session.js';
import type { SessionId } from '../../../modules/session/domain/identifiers/session-ids.js';
import { InMemorySessionRepository } from '../../../modules/session/infrastructure/repositories/in-memory-session-repository.js';
import type { DatabaseClient } from '../database-client.js';

export class PrismaSessionRepository implements SessionRepository {
  private readonly delegate = new InMemorySessionRepository();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: SessionId): Promise<LearningSession | null> {
    return this.delegate.findById(id);
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningSession[]> {
    return this.delegate.findByStudentId(studentId);
  }

  async findActiveByStudentId(studentId: StudentId): Promise<LearningSession | null> {
    return this.delegate.findActiveByStudentId(studentId);
  }

  async save(session: LearningSession): Promise<void> {
    await this.delegate.save(session);
  }

  async delete(id: SessionId): Promise<void> {
    await this.delegate.delete(id);
  }
}
