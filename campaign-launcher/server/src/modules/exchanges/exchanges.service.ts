import { Injectable } from '@nestjs/common';
import * as ccxt from 'ccxt';
import { LRUCache } from 'lru-cache';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import logger from '@/logger';

import { ExchangeDataDto } from './exchanges.dto';
import { ExchangeType } from './types';

const tradingPairsCache = new LRUCache<string, string[]>({
  ttl: 1000 * 60 * 60 * 24, // new trading pairs do not appear often
  max: 20, // we don't expect more than that exchanges to be actively used
  ttlAutopurge: false,
  allowStale: false,
  noDeleteOnStaleGet: false,
  noUpdateTTL: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

@Injectable()
export class ExchangesService {
  private readonly logger = logger.child({ context: ExchangesService.name });

  readonly supportedExchanges: readonly ExchangeDataDto[];

  constructor() {
    const supportedExchanges: ExchangeDataDto[] = [];
    for (const exchangeName of SUPPORTED_EXCHANGE_NAMES) {
      const exchange = new ccxt[exchangeName]();
      supportedExchanges.push({
        name: exchangeName,
        displayName: exchange.name,
        url: exchange.urls.www,
        logo: exchange.urls.logo,
        type: ExchangeType.CEX,
      });
    }

    this.supportedExchanges = Object.freeze(supportedExchanges);
  }

  async getExchangeTradingPairs(exchangeName: string): Promise<string[]> {
    try {
      if (!tradingPairsCache.has(exchangeName)) {
        const exchange = new ccxt[exchangeName]();
        await exchange.loadMarkets();
        tradingPairsCache.set(exchangeName, exchange.symbols);
      }

      return tradingPairsCache.get(exchangeName) as string[];
    } catch (error) {
      const errorMessage = 'Failed to load trading pairs for exchange';
      this.logger.error(errorMessage, {
        exchangeName,
        error,
      });

      throw new Error(errorMessage);
    }
  }
}
