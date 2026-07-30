import type { JobOptions, JobProcessor, JobQueue, QueueJob } from './job-queue.js';

export interface BullMQClientLike {
  add(name: string, data: unknown, opts?: unknown): Promise<{ id: string }>;
  getJob(id: string): Promise<unknown>;
}

export class BullMQJobQueueAdapter implements JobQueue {
  constructor(
    private readonly queueName: string,
    private readonly client?: BullMQClientLike,
  ) {}

  async enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options?: JobOptions,
  ): Promise<QueueJob<TPayload>> {
    if (this.client) {
      const jobRes = await this.client.add(name, payload, {
        attempts: (options?.retries ?? 0) + 1,
        delay: options?.delayMs,
        priority: options?.priority,
      });

      return {
        attemptsMade: 0,
        createdAt: new Date(),
        id: jobRes.id,
        maxAttempts: (options?.retries ?? 0) + 1,
        name,
        payload,
        status: options?.delayMs ? 'delayed' : 'queued',
      };
    }

    return {
      attemptsMade: 0,
      createdAt: new Date(),
      id: `bullmq-${Date.now()}`,
      maxAttempts: (options?.retries ?? 0) + 1,
      name,
      payload,
      status: options?.delayMs && options.delayMs > 0 ? 'delayed' : 'queued',
    };
  }

  async getJob(id: string): Promise<QueueJob | null> {
    if (this.client) {
      const raw = await this.client.getJob(id);
      if (!raw) return null;
    }
    return null;
  }

  async process<TPayload, TResult>(
    name: string,
    processor: JobProcessor<TPayload, TResult>,
  ): Promise<void> {
    void name;
    void processor;
  }

  get queue(): string {
    return this.queueName;
  }
}
