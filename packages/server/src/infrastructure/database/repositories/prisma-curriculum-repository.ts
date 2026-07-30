import type { CurriculumItemId } from '../../../modules/curriculum/domain/identifiers/curriculum-ids.js';
import type { DatabaseClient } from '../database-client.js';

export interface CurriculumItemRecord {
  description: string;
  difficulty: string;
  estimatedMins: number;
  id: string;
  title: string;
}

export interface CurriculumRepository {
  delete(id: CurriculumItemId): Promise<void>;
  findAll(): Promise<readonly CurriculumItemRecord[]>;
  findById(id: CurriculumItemId): Promise<CurriculumItemRecord | null>;
  save(item: CurriculumItemRecord): Promise<void>;
}

export class PrismaCurriculumRepository implements CurriculumRepository {
  private readonly memoryStore = new Map<string, CurriculumItemRecord>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: CurriculumItemId): Promise<CurriculumItemRecord | null> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.dbClient as any).curriculumItem.findUnique({
        where: { id: id.value },
      });
    }
    return this.memoryStore.get(id.value) ?? null;
  }

  async findAll(): Promise<readonly CurriculumItemRecord[]> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.dbClient as any).curriculumItem.findMany();
    }
    return Object.freeze(Array.from(this.memoryStore.values()));
  }

  async save(item: CurriculumItemRecord): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).curriculumItem.upsert({
        where: { id: item.id },
        update: {
          description: item.description,
          difficulty: item.difficulty,
          estimatedMins: item.estimatedMins,
          title: item.title,
        },
        create: {
          description: item.description,
          difficulty: item.difficulty,
          estimatedMins: item.estimatedMins,
          id: item.id,
          title: item.title,
        },
      });
      return;
    }
    this.memoryStore.set(item.id, item);
  }

  async delete(id: CurriculumItemId): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).curriculumItem.delete({
        where: { id: id.value },
      });
      return;
    }
    this.memoryStore.delete(id.value);
  }
}
