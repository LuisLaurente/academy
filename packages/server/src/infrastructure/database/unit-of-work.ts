import type { DatabaseClient, DatabaseTransactionClient } from './database-client.js';

export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  isTransactionActive(): boolean;
  rollback(): Promise<void>;
  runInTransaction<T>(work: (tx: DatabaseTransactionClient) => Promise<T>): Promise<T>;
}

export class DatabaseUnitOfWork implements UnitOfWork {
  private activeTransaction: DatabaseTransactionClient | null = null;

  constructor(private readonly client?: DatabaseClient) {}

  async begin(): Promise<void> {
    if (this.activeTransaction) {
      throw new Error('Transaction is already active in this UnitOfWork.');
    }
    this.activeTransaction = {
      execute: async (action) => action(this.activeTransaction!),
    };
  }

  async commit(): Promise<void> {
    if (!this.activeTransaction) {
      throw new Error('No active transaction to commit.');
    }
    if (this.activeTransaction.$commit) {
      await this.activeTransaction.$commit();
    }
    this.activeTransaction = null;
  }

  async rollback(): Promise<void> {
    if (!this.activeTransaction) {
      throw new Error('No active transaction to rollback.');
    }
    if (this.activeTransaction.$rollback) {
      await this.activeTransaction.$rollback();
    }
    this.activeTransaction = null;
  }

  isTransactionActive(): boolean {
    return this.activeTransaction !== null;
  }

  async runInTransaction<T>(work: (tx: DatabaseTransactionClient) => Promise<T>): Promise<T> {
    if (this.client) {
      return this.client.$transaction(async (tx) => work(tx));
    }

    await this.begin();
    try {
      const result = await work(this.activeTransaction!);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
