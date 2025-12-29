import { Inject } from '@nestjs/common';

import { REDIS_CACHE_CLIENT, type RedisClient } from '@/infrastructure/redis';

enum ExchangeDataKey {
  TRADING_PAIRS = 'trading_pairs',
  CURRENCIES = 'currencies',
}

const ExchangeDataTtl: Record<ExchangeDataKey, number> = {
  // new trading pairs do not appear often
  [ExchangeDataKey.TRADING_PAIRS]: 60 * 60 * 24,

  // new currencies do not appear often
  [ExchangeDataKey.CURRENCIES]: 60 * 60 * 24,
};

export class ExchangesCache {
  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly redisCacheClient: RedisClient,
  ) {}

  private makeCacheKey(exchangeName: string, dataKey: string): string {
    return `exchanges:${exchangeName}:${dataKey}`;
  }

  async getTradingPairs(exchangeName: string): Promise<string[] | null> {
    const cacheKey = this.makeCacheKey(
      exchangeName,
      ExchangeDataKey.TRADING_PAIRS,
    );

    const tradingPairs = await this.redisCacheClient.get(cacheKey);

    if (!tradingPairs) {
      return null;
    }

    return JSON.parse(tradingPairs) as string[];
  }

  async setTradingParis(
    exchangeName: string,
    tradingPairs: string[],
  ): Promise<void> {
    const cacheKey = this.makeCacheKey(
      exchangeName,
      ExchangeDataKey.TRADING_PAIRS,
    );

    await this.redisCacheClient.setEx(
      cacheKey,
      ExchangeDataTtl[ExchangeDataKey.TRADING_PAIRS],
      JSON.stringify(tradingPairs),
    );
  }

  async getCurrencies(exchangeName: string): Promise<string[] | null> {
    const cacheKey = this.makeCacheKey(
      exchangeName,
      ExchangeDataKey.CURRENCIES,
    );

    const currencies = await this.redisCacheClient.get(cacheKey);

    if (!currencies) {
      return null;
    }

    return JSON.parse(currencies) as string[];
  }

  async setCurrencies(
    exchangeName: string,
    currencies: string[],
  ): Promise<void> {
    const cacheKey = this.makeCacheKey(
      exchangeName,
      ExchangeDataKey.CURRENCIES,
    );

    await this.redisCacheClient.setEx(
      cacheKey,
      ExchangeDataTtl[ExchangeDataKey.CURRENCIES],
      JSON.stringify(currencies),
    );
  }
}
