import { CryptoUuidService } from '../../core/identifiers/uuid-service.js';
import type { JobOptions, JobProcessor, JobQueue, QueueJob } from './job-queue.js';

const uuidService = new CryptoUuidService();

export class InMemoryJobQueue implements JobQueue {
  private readonly jobs = new Map<string, QueueJob>();
  private readonly processors = new Map<string, JobProcessor>();

  async enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options?: JobOptions,
  ): Promise<QueueJob<TPayload>> {
    const id = uuidService.generate();
    const job: QueueJob<TPayload> = {
      attemptsMade: 0,
      createdAt: new Date(),
      id,
      maxAttempts: (options?.retries ?? 0) + 1,
      name,
      payload,
      status: options?.delayMs && options.delayMs > 0 ? 'delayed' : 'queued',
    };

    this.jobs.set(id, job as QueueJob);

    if (options?.delayMs && options.delayMs > 0) {
      setTimeout(() => {
        const stored = this.jobs.get(id);
        if (stored && stored.status === 'delayed') {
          this.jobs.set(id, { ...stored, status: 'queued' });
        }
      }, options.delayMs);
    } else if (this.processors.has(name)) {
      await this.executeJob(job as QueueJob, this.processors.get(name)!);
    }

    return (this.jobs.get(id) as QueueJob<TPayload>) ?? job;
  }

  async getJob(id: string): Promise<QueueJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async process<TPayload, TResult>(
    name: string,
    processor: JobProcessor<TPayload, TResult>,
  ): Promise<void> {
    this.processors.set(name, processor as JobProcessor);

    for (const job of this.jobs.values()) {
      if (job.name === name && job.status === 'queued') {
        await this.executeJob(job, processor as JobProcessor);
      }
    }
  }

  private async executeJob(job: QueueJob, processor: JobProcessor): Promise<void> {
    const updatedJob: QueueJob = {
      ...job,
      attemptsMade: job.attemptsMade + 1,
      status: 'processing',
    };
    this.jobs.set(job.id, updatedJob);

    try {
      await processor(updatedJob);
      this.jobs.set(job.id, { ...updatedJob, status: 'completed' });
    } catch {
      if (updatedJob.attemptsMade < updatedJob.maxAttempts) {
        this.jobs.set(job.id, { ...updatedJob, status: 'queued' });
      } else {
        this.jobs.set(job.id, { ...updatedJob, status: 'failed' });
      }
    }
  }

  clear(): void {
    this.jobs.clear();
    this.processors.clear();
  }

  get count(): number {
    return this.jobs.size;
  }
}
