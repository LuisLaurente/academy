import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationRepository } from '../../application/ports/recommendation-repository.js';
import type { RecommendationSet } from '../../domain/aggregates/recommendation-set.js';
import type { RecommendationSetId } from '../../domain/identifiers/recommendation-ids.js';

export class InMemoryRecommendationRepository implements RecommendationRepository {
  private readonly sets = new Map<string, RecommendationSet>();

  async findById(id: RecommendationSetId): Promise<RecommendationSet | null> {
    const set = this.sets.get(id.toString());
    return set ?? null;
  }

  async findByStudentId(studentId: StudentId): Promise<readonly RecommendationSet[]> {
    const results: RecommendationSet[] = [];
    for (const set of this.sets.values()) {
      if (set.studentId.equals(studentId)) {
        results.push(set);
      }
    }
    return Object.freeze(results);
  }

  async findActiveByStudentId(
    studentId: StudentId,
    now = new Date(),
  ): Promise<RecommendationSet | null> {
    const studentSets = await this.findByStudentId(studentId);
    const activeSets = studentSets.filter((s) => !s.isExpired(now));
    if (activeSets.length === 0) {
      return null;
    }
    // Return most recently generated active set
    activeSets.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    return activeSets[0] ?? null;
  }

  async save(set: RecommendationSet): Promise<void> {
    this.sets.set(set.id.toString(), set);
  }

  async delete(id: RecommendationSetId): Promise<void> {
    this.sets.delete(id.toString());
  }

  clear(): void {
    this.sets.clear();
  }

  get count(): number {
    return this.sets.size;
  }
}
