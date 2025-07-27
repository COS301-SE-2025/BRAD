import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
 
    constructor(@InjectQueue('reportQueue') private readonly reportQueue: Queue) {}

  async addReportJob(
    data: Record<string, any>,
    opts: {
      jobId?: string;
      delay?: number;
      attempts?: number;
    } = {},
  ) {
    try {
      const job = await this.reportQueue.add('analyze', data, {
        jobId: opts.jobId,
        delay: opts.delay ?? 0,
        attempts: opts.attempts ?? 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      console.log(`Job [${job.name}] added to reportQueue with ID: ${job.id}`);
      return job;
    } catch (err) {
      console.log('Failed to enqueue report job', err);
      throw err;
    }
  }
}
