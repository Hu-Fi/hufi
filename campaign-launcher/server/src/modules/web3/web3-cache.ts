import { Inject } from '@nestjs/common';

import { REDIS_CACHE_CLIENT, type RedisClient } from '@/infrastructure/redis';

enum Web3DataKey {
  TOKEN_PRICE = 'token_price',
}

export class Web3Cache {
  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly redisCacheClient: RedisClient,
  ) {}

  private makeCacheKey(dataKeyParts: string[]): string {
    return `web3:${dataKeyParts.join(':')}`;
  }

  private normalizeTokenSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  async getTokenPriceUsd(symbol: string): Promise<number | null> {
    const cacheKey = this.makeCacheKey([
      Web3DataKey.TOKEN_PRICE,
      this.normalizeTokenSymbol(symbol),
    ]);

    const tokenPriceUsd = await this.redisCacheClient.get(cacheKey);

    if (tokenPriceUsd === null) {
      return null;
    }

    return Number(tokenPriceUsd);
  }

  async setTokenPriceUsd(symbol: string, tokenPriceUsd: number): Promise<void> {
    const cacheKey = this.makeCacheKey([
      Web3DataKey.TOKEN_PRICE,
      this.normalizeTokenSymbol(symbol),
    ]);

    await this.redisCacheClient.setEx(cacheKey, 60, tokenPriceUsd.toString());
  }
}
