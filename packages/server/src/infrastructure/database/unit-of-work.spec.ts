import { describe, expect, it } from 'vitest';
import { DatabaseUnitOfWork } from './unit-of-work.js';

describe('DatabaseUnitOfWork', () => {
  it('manages transaction lifecycle and state', async () => {
    const uow = new DatabaseUnitOfWork();

    expect(uow.isTransactionActive()).toBe(false);
    await uow.begin();
    expect(uow.isTransactionActive()).toBe(true);
    await uow.commit();
    expect(uow.isTransactionActive()).toBe(false);
  });

  it('handles rollback', async () => {
    const uow = new DatabaseUnitOfWork();
    await uow.begin();
    expect(uow.isTransactionActive()).toBe(true);
    await uow.rollback();
    expect(uow.isTransactionActive()).toBe(false);
  });

  it('runs work inside transactional scope', async () => {
    const uow = new DatabaseUnitOfWork();
    let executed = false;

    const result = await uow.runInTransaction(async (tx) => {
      expect(tx).toBeDefined();
      executed = true;
      return 'transaction-result';
    });

    expect(executed).toBe(true);
    expect(result).toBe('transaction-result');
  });

  it('rolls back on error in runInTransaction', async () => {
    const uow = new DatabaseUnitOfWork();

    await expect(
      uow.runInTransaction(async () => {
        throw new Error('Database Error');
      }),
    ).rejects.toThrow('Database Error');

    expect(uow.isTransactionActive()).toBe(false);
  });
});
