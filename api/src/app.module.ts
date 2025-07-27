import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'reportQueue' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
