export interface UnitOfWork {
  execute<TResult>(work: () => Promise<TResult>): Promise<TResult>;
}
