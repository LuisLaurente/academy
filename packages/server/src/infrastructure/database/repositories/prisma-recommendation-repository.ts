import type { StudentId } from '../../../modules/learning/domain/identifiers/learning-ids.js';
import type { RecommendationRepository } from '../../../modules/recommendation/application/ports/recommendation-repository.js';
import type { RecommendationSet } from '../../../modules/recommendation/domain/aggregates/recommendation-set.js';
import type { RecommendationSetId } from '../../../modules/recommendation/domain/identifiers/recommendation-ids.js';
import { InMemoryRecommendationRepository } from '../../../modules/recommendation/infrastructure/repositories/in-memory-recommendation-repository.js';
import type { DatabaseClient } from '../database-client.js';

export class PrismaRecommendationRepository implements RecommendationRepository {
  private readonly delegate = new InMemoryRecommendationRepository();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: RecommendationSetId): Promise<RecommendationSet | null> {
    return this.delegate.findById(id);
  }

  async findByStudentId(studentId: StudentId): Promise<readonly RecommendationSet[]> {
    return this.delegate.findByStudentId(studentId);
  }

  async findActiveByStudentId(
    studentId: StudentId,
    now = new Date(),
  ): Promise<RecommendationSet | null> {
    return this.delegate.findActiveByStudentId(studentId, now);
  }

  async save(set: RecommendationSet): Promise<void> {
    await this.delegate.save(set);
  }

  async delete(id: RecommendationSetId): Promise<void> {
    await this.delegate.delete(id);
  }
}
