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
    return this.memoryStore.get(id.value) ?? null;
  }

  async findAll(): Promise<readonly CurriculumItemRecord[]> {
    return Object.freeze(Array.from(this.memoryStore.values()));
  }

  async save(item: CurriculumItemRecord): Promise<void> {
    this.memoryStore.set(item.id, item);
  }

  async delete(id: CurriculumItemId): Promise<void> {
    this.memoryStore.delete(id.value);
  }
}
