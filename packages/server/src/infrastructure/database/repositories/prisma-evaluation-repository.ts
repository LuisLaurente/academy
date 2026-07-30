import type { DatabaseClient } from '../database-client.js';

export interface EvaluationRecordData {
  evaluatedAt: Date;
  exerciseId: string;
  feedback?: string | null;
  id: string;
  isPassed: boolean;
  score: number;
  studentId: string;
}

export interface EvaluationRepository {
  delete(id: string): Promise<void>;
  findById(id: string): Promise<EvaluationRecordData | null>;
  findByStudentId(studentId: string): Promise<readonly EvaluationRecordData[]>;
  save(evaluation: EvaluationRecordData): Promise<void>;
}

export class PrismaEvaluationRepository implements EvaluationRepository {
  private readonly memoryStore = new Map<string, EvaluationRecordData>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: string): Promise<EvaluationRecordData | null> {
    return this.memoryStore.get(id) ?? null;
  }

  async findByStudentId(studentId: string): Promise<readonly EvaluationRecordData[]> {
    const list: EvaluationRecordData[] = [];
    for (const record of this.memoryStore.values()) {
      if (record.studentId === studentId) {
        list.push(record);
      }
    }
    return Object.freeze(list);
  }

  async save(evaluation: EvaluationRecordData): Promise<void> {
    this.memoryStore.set(evaluation.id, evaluation);
  }

  async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
  }
}
