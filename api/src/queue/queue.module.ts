import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reportQueue',
    }),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
