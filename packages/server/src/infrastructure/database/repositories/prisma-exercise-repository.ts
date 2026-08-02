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
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.dbClient as any).exercise.findUnique({
        where: { id },
      });
    }
    return this.memoryStore.get(id) ?? null;
  }

  async save(exercise: ExerciseRecord): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).exercise.upsert({
        where: { id: exercise.id },
        update: {
          difficulty: exercise.difficulty,
          exerciseType: exercise.exerciseType,
          prompt: exercise.prompt,
          title: exercise.title,
        },
        create: {
          difficulty: exercise.difficulty,
          exerciseType: exercise.exerciseType,
          id: exercise.id,
          prompt: exercise.prompt,
          title: exercise.title,
        },
      });
      return;
    }
    this.memoryStore.set(exercise.id, exercise);
  }

  async delete(id: string): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).exercise.delete({
        where: { id },
      });
      return;
    }
    this.memoryStore.delete(id);
  }
}
