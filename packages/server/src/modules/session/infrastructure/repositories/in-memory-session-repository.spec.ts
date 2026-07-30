import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import { LearningSession } from '../../domain/aggregates/learning-session.js';
import { SessionId } from '../../domain/identifiers/session-ids.js';
import { InMemorySessionRepository } from './in-memory-session-repository.js';

const uuidService = new CryptoUuidService();

describe('InMemorySessionRepository', () => {
  it('saves, retrieves, finds active session and deletes', async () => {
    const repo = new InMemorySessionRepository();
    const student1 = StudentId.create(uuidService.generate());
    const student2 = StudentId.create(uuidService.generate());

    const activeSession = LearningSession.start({
      id: SessionId.create(uuidService.generate()),
      items: [],
      studentId: student1,
    });

    const finishedSession = LearningSession.start({
      id: SessionId.create(uuidService.generate()),
      items: [],
      studentId: student1,
    });
    finishedSession.finish();

    const student2Session = LearningSession.start({
      id: SessionId.create(uuidService.generate()),
      items: [],
      studentId: student2,
    });

    await repo.save(activeSession);
    await repo.save(finishedSession);
    await repo.save(student2Session);

    expect(repo.count).toBe(3);

    const foundActive = await repo.findActiveByStudentId(student1);
    expect(foundActive).not.toBeNull();
    expect(foundActive?.id.equals(activeSession.id)).toBe(true);

    const allStudent1 = await repo.findByStudentId(student1);
    expect(allStudent1.length).toBe(2);

    await repo.delete(activeSession.id);
    expect(repo.count).toBe(2);

    repo.clear();
    expect(repo.count).toBe(0);
  });
});
