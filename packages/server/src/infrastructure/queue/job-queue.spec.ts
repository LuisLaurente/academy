import { describe, expect, it } from 'vitest';
import { BullMQJobQueueAdapter } from './bullmq-job-queue-adapter.js';
import { InMemoryJobQueue } from './in-memory-job-queue.js';

describe('Queue Infrastructure', () => {
  it('InMemoryJobQueue enqueues, processes, and tracks status', async () => {
    const queue = new InMemoryJobQueue();
    let processedPayload: string | null = null;

    const job = await queue.enqueue('generate_content', { topic: 'DDD' });
    expect(job.status).toBe('queued');

    await queue.process<{ topic: string }, void>('generate_content', async (j) => {
      processedPayload = j.payload.topic;
    });

    expect(processedPayload).toBe('DDD');
    const storedJob = await queue.getJob(job.id);
    expect(storedJob?.status).toBe('completed');
  });

  it('InMemoryJobQueue supports retries on failure', async () => {
    const queue = new InMemoryJobQueue();
    let attemptCount = 0;

    const job = await queue.enqueue('failing_job', { attempt: 1 }, { retries: 2 });

    await queue.process('failing_job', async () => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('First attempt failed');
      }
    });

    expect(attemptCount).toBe(1);
    const stored = await queue.getJob(job.id);
    expect(stored?.status).toBe('queued');
  });

  it('BullMQJobQueueAdapter enqueues jobs for BullMQ queue', async () => {
    const adapter = new BullMQJobQueueAdapter('ai-generation-queue');
    const job = await adapter.enqueue('ai_request', { prompt: 'hello' }, { delayMs: 1000 });

    expect(adapter.queue).toBe('ai-generation-queue');
    expect(job.status).toBe('delayed');
  });
});
