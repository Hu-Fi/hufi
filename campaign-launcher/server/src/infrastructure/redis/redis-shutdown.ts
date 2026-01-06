import { Inject, OnApplicationShutdown } from '@nestjs/common';

import logger from '@/logger';

import { REDIS_CACHE_CLIENT } from './constants';
import { type RedisClient } from './redis.factory';

export class RedisShutdown implements OnApplicationShutdown {
  private readonly logger = logger.child({
    context: RedisShutdown.name,
  });

  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly redisCacheClient: RedisClient,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    this.logger.debug('Closing Redis cache client connection on shutdown');

    try {
      await this.redisCacheClient.close();
      this.logger.debug('Redis cache client connection closed');
    } catch (error) {
      this.logger.error('Failed to close Redis cache client connection', {
        error,
      });
    }
  }
}
