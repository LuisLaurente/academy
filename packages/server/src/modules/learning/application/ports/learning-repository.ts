import type { LearningRecord } from '../../domain/aggregates/learning-record.js';
import type { LearningRecordId, StudentId } from '../../domain/identifiers/learning-ids.js';

export interface LearningRepository {
  delete(id: LearningRecordId): Promise<void>;
  findById(id: LearningRecordId): Promise<LearningRecord | null>;
  findByStudentId(studentId: StudentId): Promise<readonly LearningRecord[]>;
  save(record: LearningRecord): Promise<void>;
}
