import { Module } from '@nestjs/common';

import { RedisConfigService } from '@/config';

import { REDIS_CACHE_CLIENT } from './constants';
import RedisFactory from './redis.factory';

@Module({
  providers: [
    {
      provide: REDIS_CACHE_CLIENT,
      useFactory: async (redisConfigService: RedisConfigService) => {
        const redisClient = RedisFactory({
          name: 'cache',
          endpoint: redisConfigService.cacheUrl,
        });

        await redisClient.connect();
        await redisClient.ping();

        return redisClient;
      },
      inject: [RedisConfigService],
    },
  ],
  exports: [REDIS_CACHE_CLIENT],
})
export class RedisModule {}
