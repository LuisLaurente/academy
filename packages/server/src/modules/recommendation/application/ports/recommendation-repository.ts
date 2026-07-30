import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationSet } from '../../domain/aggregates/recommendation-set.js';
import type { RecommendationSetId } from '../../domain/identifiers/recommendation-ids.js';

export interface RecommendationRepository {
  delete(id: RecommendationSetId): Promise<void>;
  findActiveByStudentId(studentId: StudentId, now?: Date): Promise<RecommendationSet | null>;
  findById(id: RecommendationSetId): Promise<RecommendationSet | null>;
  findByStudentId(studentId: StudentId): Promise<readonly RecommendationSet[]>;
  save(set: RecommendationSet): Promise<void>;
}
