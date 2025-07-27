// src/queue/queue.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('reportQueue') private readonly reportQueue: Queue,
  ) {}

  async addReportJob(data: { reportId: string; domain: string }) {
    await this.reportQueue.add('report_submitted', data);
    console.log(`[QUEUE] Job added: ${data.domain} (${data.reportId})`);
  }
}
