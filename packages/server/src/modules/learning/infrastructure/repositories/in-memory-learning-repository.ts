import type { LearningRepository } from '../../application/ports/learning-repository.js';
import type { LearningRecord } from '../../domain/aggregates/learning-record.js';
import type { LearningRecordId, StudentId } from '../../domain/identifiers/learning-ids.js';

export class InMemoryLearningRepository implements LearningRepository {
  private readonly records = new Map<string, LearningRecord>();

  async findById(id: LearningRecordId): Promise<LearningRecord | null> {
    const record = this.records.get(id.toString());
    return record ?? null;
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningRecord[]> {
    const results: LearningRecord[] = [];
    for (const record of this.records.values()) {
      if (record.studentId.equals(studentId)) {
        results.push(record);
      }
    }
    return Object.freeze(results);
  }

  async save(record: LearningRecord): Promise<void> {
    this.records.set(record.id.toString(), record);
  }

  async delete(id: LearningRecordId): Promise<void> {
    this.records.delete(id.toString());
  }

  clear(): void {
    this.records.clear();
  }

  get count(): number {
    return this.records.size;
  }
}
