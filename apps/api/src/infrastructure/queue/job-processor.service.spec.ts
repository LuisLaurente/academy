import { InMemoryJobQueue } from '@learning-os/server/infrastructure';
import { describe, expect, it, vi } from 'vitest';
import { JobProcessorService } from './job-processor.service';

describe('JobProcessorService', () => {
  it('enqueues and processes background jobs', async () => {
    const queue = new InMemoryJobQueue();
    const service = new JobProcessorService(queue);
    const handler = vi.fn().mockResolvedValue({ processed: true });

    await service.registerHandler('ai_generation', handler);

    const job = await service.enqueueJob('ai_generation', { prompt: 'Generate Quiz' });
    expect(job.id).toBeTruthy();
    expect(job.name).toBe('ai_generation');
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { prompt: 'Generate Quiz' },
      }),
    );
  });
});
