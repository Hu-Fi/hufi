import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

import { CacheManager } from '@/infrastructure/cache';

enum ExchangeDataKey {
  TRADING_PAIRS = 'trading_pairs',
  CURRENCIES = 'currencies',
}

@Injectable()
export class ExchangesCache {
  constructor(private readonly cacheManager: CacheManager) {}

  async getTradingPairs(exchangeName: string): Promise<string[] | null> {
    const cacheKey = CacheManager.makeCacheKey([
      exchangeName,
      ExchangeDataKey.TRADING_PAIRS,
    ]);

    const tradingPairs = await this.cacheManager.get<string>(cacheKey);

    if (tradingPairs === null) {
      return null;
    }

    return JSON.parse(tradingPairs) as string[];
  }

  async setTradingPairs(
    exchangeName: string,
    tradingPairs: string[],
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      exchangeName,
      ExchangeDataKey.TRADING_PAIRS,
    ]);

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(tradingPairs),
      // new trading pairs do not appear often
      dayjs.duration(5, 'days').asMilliseconds(),
    );
  }

  async getCurrencies(exchangeName: string): Promise<string[] | null> {
    const cacheKey = CacheManager.makeCacheKey([
      exchangeName,
      ExchangeDataKey.CURRENCIES,
    ]);

    const currencies = await this.cacheManager.get<string>(cacheKey);

    if (currencies === null) {
      return null;
    }

    return JSON.parse(currencies) as string[];
  }

  async setCurrencies(
    exchangeName: string,
    currencies: string[],
  ): Promise<void> {
    const cacheKey = CacheManager.makeCacheKey([
      exchangeName,
      ExchangeDataKey.CURRENCIES,
    ]);

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(currencies),
      // new currencies do not appear often
      dayjs.duration(5, 'days').asMilliseconds(),
    );
  }
}
