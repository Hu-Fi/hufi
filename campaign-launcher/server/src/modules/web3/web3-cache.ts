import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

import { CacheManager } from '@/infrastructure/cache';

enum Web3DataKey {
  TOKEN_PRICE = 'token_price',
}

@Injectable()
export class Web3Cache {
  constructor(private readonly cacheManager: CacheManager) {}

  private normalizeTokenSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  async getTokenPriceUsd(symbol: string): Promise<number | null> {
    const cacheKey = CacheManager.makeCacheKey([
      Web3DataKey.TOKEN_PRICE,
      this.normalizeTokenSymbol(symbol),
    ]);

    const tokenPriceUsd = await this.cacheManager.get<string>(cacheKey);

    if (tokenPriceUsd === null) {
      return null;
    }

    return Number(tokenPriceUsd);
  }

  async setTokenPriceUsd(symbol: string, tokenPriceUsd: number): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      Web3DataKey.TOKEN_PRICE,
      this.normalizeTokenSymbol(symbol),
    ]);

    await this.cacheManager.set(
      cacheKey,
      tokenPriceUsd.toString(),
      dayjs.duration(1, 'minute').asMilliseconds(),
    );
  }
}
