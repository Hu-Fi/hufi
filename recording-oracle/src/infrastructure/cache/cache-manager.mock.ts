import { CachedValue, CacheManager } from './cache-manager';

type MockedCacheManager = Omit<CacheManager, 'private'> & {
  clear: () => void;
};

export class CacheManagerMock implements MockedCacheManager {
  readonly __cache = new Map();

  readonly namespace = 'unit-tests-mock';

  async get<T extends CachedValue>(key: string): Promise<T | null> {
    return this.__cache.get(key) ?? null;
  }

  async set(key: string, value: CachedValue): Promise<void> {
    this.__cache.set(key, value);
  }

  async del(key: string): Promise<boolean> {
    return this.__cache.delete(key);
  }

  clear(): void {
    this.__cache.clear();
  }
}
