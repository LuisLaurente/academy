import type { DatabaseClient } from '../database-client.js';

export interface ContentBlockRecord {
  body: string;
  contentType: string;
  id: string;
  title: string;
  version: string;
}

export interface ContentRepository {
  delete(id: string): Promise<void>;
  findById(id: string): Promise<ContentBlockRecord | null>;
  save(block: ContentBlockRecord): Promise<void>;
}

export class PrismaContentRepository implements ContentRepository {
  private readonly memoryStore = new Map<string, ContentBlockRecord>();

  constructor(private readonly dbClient?: DatabaseClient) {}

  get client(): DatabaseClient | undefined {
    return this.dbClient;
  }

  async findById(id: string): Promise<ContentBlockRecord | null> {
    return this.memoryStore.get(id) ?? null;
  }

  async save(block: ContentBlockRecord): Promise<void> {
    this.memoryStore.set(block.id, block);
  }

  async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
  }
}
