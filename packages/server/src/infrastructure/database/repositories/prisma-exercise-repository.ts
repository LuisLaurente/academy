import type { DatabaseClient } from '../database-client.js';

export interface ExerciseRecord {
  difficulty: string;
  exerciseType: string;
  id: string;
  prompt: string;
  title: string;
}

export interface ExerciseRepository {
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ExerciseRecord | null>;
  save(exercise: ExerciseRecord): Promise<void>;
}

export class PrismaExerciseRepository implements ExerciseRepository {
  private readonly memoryStore = new Map<string, ExerciseRecord>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: string): Promise<ExerciseRecord | null> {
    return this.memoryStore.get(id) ?? null;
  }

  async save(exercise: ExerciseRecord): Promise<void> {
    this.memoryStore.set(exercise.id, exercise);
  }

  async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
  }
}
