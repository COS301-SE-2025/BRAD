import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QueueService } from './queue.service';

@Module({
  imports: [HttpModule],
  providers: [QueueService],
  exports: [QueueService],  // Export the service so it can be injected elsewhere
})
export class QueueModule {}


// This module provides the QueueService which handles communication with the FastAPI queue
// It uses HttpModule to make HTTP requests to the FastAPI endpoint for queuing reports.