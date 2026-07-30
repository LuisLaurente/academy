import type { StudentId } from '../../../learning/domain/identifiers/learning-ids.js';
import type { SessionRepository } from '../../application/ports/session-repository.js';
import type { LearningSession } from '../../domain/aggregates/learning-session.js';
import type { SessionId } from '../../domain/identifiers/session-ids.js';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, LearningSession>();

  async findById(id: SessionId): Promise<LearningSession | null> {
    const session = this.sessions.get(id.toString());
    return session ?? null;
  }

  async findByStudentId(studentId: StudentId): Promise<readonly LearningSession[]> {
    const results: LearningSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.studentId.equals(studentId)) {
        results.push(session);
      }
    }
    return Object.freeze(results);
  }

  async findActiveByStudentId(studentId: StudentId): Promise<LearningSession | null> {
    const studentSessions = await this.findByStudentId(studentId);
    const activeSessions = studentSessions.filter((s) => !s.isFinished());
    if (activeSessions.length === 0) {
      return null;
    }
    activeSessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return activeSessions[0] ?? null;
  }

  async save(session: LearningSession): Promise<void> {
    this.sessions.set(session.id.toString(), session);
  }

  async delete(id: SessionId): Promise<void> {
    this.sessions.delete(id.toString());
  }

  clear(): void {
    this.sessions.clear();
  }

  get count(): number {
    return this.sessions.size;
  }
}
