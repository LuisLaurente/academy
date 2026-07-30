import type { JobProcessor, JobQueue, QueueJob } from '@learning-os/server/infrastructure';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);

  constructor(private readonly jobQueue: JobQueue) {}

  public async registerHandler<TPayload, TResult>(
    jobName: string,
    handler: JobProcessor<TPayload, TResult>,
  ): Promise<void> {
    this.logger.log(`Registering background job processor for: ${jobName}`);
    await this.jobQueue.process(jobName, async (job: QueueJob<TPayload>) => {
      this.logger.log(`Processing job ${job.id} (${job.name})`);
      try {
        const result = await handler(job);
        this.logger.log(`Job ${job.id} completed successfully`);
        return result;
      } catch (error) {
        this.logger.error(`Job ${job.id} failed: ${(error as Error).message}`);
        throw error;
      }
    });
  }

  public async enqueueJob<TPayload>(
    jobName: string,
    payload: TPayload,
  ): Promise<QueueJob<TPayload>> {
    this.logger.log(`Enqueuing background job: ${jobName}`);
    return this.jobQueue.enqueue(jobName, payload);
  }
}
