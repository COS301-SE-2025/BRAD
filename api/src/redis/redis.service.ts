import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.redis.on('connect', () => {
      console.log('[REDIS] Connected');
    });

    this.redis.on('error', (err) => {
      console.error('[REDIS] Error:', err);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
    console.log('[REDIS] Disconnected');
  }

  getClient(): Redis {
    return this.redis;
  }

  async pushToQueue(queueName: string, data: any) {
    await this.redis.lpush(queueName, JSON.stringify(data));
  }

  async popFromQueue(queueName: string): Promise<any | null> {
    const result = await this.redis.brpop(queueName, 0);
    if (result) {
      const [, data] = result;
      return JSON.parse(data);
    }
    return null;
  }
}
