import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { LearningRecord } from '../../domain/aggregates/learning-record.js';
import { LearningRecordId, StudentId } from '../../domain/identifiers/learning-ids.js';
import { InMemoryLearningRepository } from './in-memory-learning-repository.js';

const uuidService = new CryptoUuidService();

describe('InMemoryLearningRepository', () => {
  it('saves, retrieves, finds by student, and deletes records', async () => {
    const repo = new InMemoryLearningRepository();
    const student1 = StudentId.create(uuidService.generate());
    const student2 = StudentId.create(uuidService.generate());

    const record1 = LearningRecord.create({
      id: LearningRecordId.create(uuidService.generate()),
      studentId: student1,
    });
    const record2 = LearningRecord.create({
      id: LearningRecordId.create(uuidService.generate()),
      studentId: student1,
    });
    const record3 = LearningRecord.create({
      id: LearningRecordId.create(uuidService.generate()),
      studentId: student2,
    });

    await repo.save(record1);
    await repo.save(record2);
    await repo.save(record3);

    expect(repo.count).toBe(3);

    const found1 = await repo.findById(record1.id);
    expect(found1).not.toBeNull();
    expect(found1?.id.equals(record1.id)).toBe(true);

    const student1Records = await repo.findByStudentId(student1);
    expect(student1Records.length).toBe(2);

    await repo.delete(record1.id);
    expect(repo.count).toBe(2);
    expect(await repo.findById(record1.id)).toBeNull();

    repo.clear();
    expect(repo.count).toBe(0);
  });
});
