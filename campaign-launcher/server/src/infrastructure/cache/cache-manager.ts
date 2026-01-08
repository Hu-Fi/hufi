import assert from 'assert';

import { Inject, Injectable } from '@nestjs/common';

import {
  VALKEY_CACHE_CLIENT,
  type ValkeyClient,
  type SetOptions,
  TimeUnit,
} from '@/infrastructure/valkey';

import { CACHE_MODULE_OPTIONS_TOKEN, KEY_PARTS_SEPARATOR } from './constants';
import { type CacheModuleOptions } from './types';

export type CachedValue = string | Buffer;

@Injectable()
export class CacheManager {
  readonly namespace: string;

  constructor(
    @Inject(CACHE_MODULE_OPTIONS_TOKEN)
    { namespace }: CacheModuleOptions,
    @Inject(VALKEY_CACHE_CLIENT)
    private readonly valkeyCacheClient: ValkeyClient,
  ) {
    assert(namespace, 'Cache namespace must be non-empty string');

    this.namespace = namespace;
  }

  static makeCacheKey(parts: Array<string | number>): string {
    return parts.join(KEY_PARTS_SEPARATOR);
  }

  private makeNamespacedKey(key: string): string {
    return CacheManager.makeCacheKey([this.namespace, key]);
  }

  async get<T extends CachedValue>(key: string): Promise<T | null> {
    const value = (await this.valkeyCacheClient.get(
      this.makeNamespacedKey(key),
    )) as T | null;

    if (value === null) {
      return null;
    }

    return value as T;
  }

  async set(key: string, value: CachedValue, ttlMs?: number): Promise<void> {
    const options: SetOptions = {};

    if (ttlMs !== undefined) {
      options.expiry = {
        count: ttlMs,
        type: TimeUnit.Milliseconds,
      };
    }

    await this.valkeyCacheClient.set(
      this.makeNamespacedKey(key),
      value,
      options,
    );
  }

  async del(key: string): Promise<boolean> {
    const nRemoved = await this.valkeyCacheClient.del([
      this.makeNamespacedKey(key),
    ]);

    return nRemoved > 0;
  }
}
