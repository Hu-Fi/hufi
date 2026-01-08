import { DynamicModule, Module } from '@nestjs/common';

import { ValkeyModule } from '@/infrastructure/valkey';

import { CacheManager } from './cache-manager';
import { CACHE_MODULE_OPTIONS_TOKEN } from './constants';
import { CacheModuleOptions } from './types';

@Module({
  imports: [ValkeyModule],
})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        CacheManager,
        {
          provide: CACHE_MODULE_OPTIONS_TOKEN,
          useValue: options,
        },
      ],
      exports: [CacheManager],
    };
  }
}
