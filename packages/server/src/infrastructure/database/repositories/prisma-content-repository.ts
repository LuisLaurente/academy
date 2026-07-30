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
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.dbClient as any).contentBlock.findUnique({
        where: { id },
      });
    }
    return this.memoryStore.get(id) ?? null;
  }

  async save(block: ContentBlockRecord): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).contentBlock.upsert({
        where: { id: block.id },
        update: {
          body: block.body,
          contentType: block.contentType,
          title: block.title,
          version: block.version,
        },
        create: {
          body: block.body,
          contentType: block.contentType,
          id: block.id,
          title: block.title,
          version: block.version,
        },
      });
      return;
    }
    this.memoryStore.set(block.id, block);
  }

  async delete(id: string): Promise<void> {
    if (this.dbClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.dbClient as any).contentBlock.delete({
        where: { id },
      });
      return;
    }
    this.memoryStore.delete(id);
  }
}
