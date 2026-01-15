import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';

import { CacheConfigService } from '@/config';
import logger from '@/logger';

import { VALKEY_CACHE_CLIENT } from './constants';
import ValkeyFactory, { type ValkeyClient } from './valkey.factory';

@Module({
  providers: [
    {
      provide: VALKEY_CACHE_CLIENT,
      useFactory: async (cacheConfigService: CacheConfigService) => {
        const cacheClient = await ValkeyFactory.create({
          name: 'cache',
          host: cacheConfigService.valkeyHost,
          port: cacheConfigService.valkeyPort,
          dbNumber: cacheConfigService.valkeyDbNumber,
          useTls: cacheConfigService.valkeyTls,
        });

        return cacheClient;
      },
      inject: [CacheConfigService],
    },
  ],
  exports: [VALKEY_CACHE_CLIENT],
})
export class ValkeyModule implements OnApplicationShutdown {
  private readonly logger = logger.child({
    context: ValkeyModule.name,
  });

  constructor(
    @Inject(VALKEY_CACHE_CLIENT) private readonly cacheClient: ValkeyClient,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.shutdownCacheClient();
  }

  private async shutdownCacheClient(): Promise<void> {
    this.logger.debug('Closing cache client connection on shutdown');

    try {
      await this.cacheClient.close();
      this.logger.debug('Cache client connection closed');
    } catch (error) {
      this.logger.error('Failed to close cache client connection', {
        error,
      });
    }
  }
}
