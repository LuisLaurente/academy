export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'delayed';

export interface JobOptions {
  readonly delayMs?: number;
  readonly priority?: number;
  readonly retries?: number;
}

export interface QueueJob<TPayload = unknown> {
  readonly attemptsMade: number;
  readonly createdAt: Date;
  readonly id: string;
  readonly maxAttempts: number;
  readonly name: string;
  readonly payload: TPayload;
  readonly status: JobStatus;
}

export type JobProcessor<TPayload = unknown, TResult = unknown> = (
  job: QueueJob<TPayload>,
) => Promise<TResult>;

export interface JobQueue {
  enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options?: JobOptions,
  ): Promise<QueueJob<TPayload>>;

  getJob(id: string): Promise<QueueJob | null>;

  process<TPayload, TResult>(
    name: string,
    processor: JobProcessor<TPayload, TResult>,
  ): Promise<void>;
}
