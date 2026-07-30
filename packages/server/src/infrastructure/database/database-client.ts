export interface DatabaseTransactionClient {
  $commit?(): Promise<void>;
  $rollback?(): Promise<void>;
  execute<T>(action: (client: DatabaseTransactionClient) => Promise<T>): Promise<T>;
  [key: string]: unknown;
}

export interface DatabaseClient {
  $transaction<T>(
    fn: (tx: DatabaseTransactionClient) => Promise<T>,
    options?: { timeout?: number },
  ): Promise<T>;
  [key: string]: unknown;
}
