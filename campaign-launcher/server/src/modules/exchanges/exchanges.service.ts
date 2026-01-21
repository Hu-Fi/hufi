import { Injectable } from '@nestjs/common';

import { ExchangesConfigService } from '@/config';
import logger from '@/logger';

import { ExchangeApiClientFactory } from './api-client';
import { ExchangesCache } from './exchanges-cache';
import { ExchangeDataDto } from './exchanges.dto';

@Injectable()
export class ExchangesService {
  private readonly logger = logger.child({ context: ExchangesService.name });

  readonly supportedExchanges: readonly ExchangeDataDto[];

  constructor(
    private readonly exchangesCache: ExchangesCache,
    private readonly exchangesConfigService: ExchangesConfigService,
    private readonly exchangeApiClientFactory: ExchangeApiClientFactory,
  ) {
    const supportedExchanges: ExchangeDataDto[] = [];
    for (const supportedExchangeName of this.exchangesConfigService.getSupportedExchanges()) {
      const exchange = this.exchangeApiClientFactory.retrieve(
        supportedExchangeName,
      );

      supportedExchanges.push(exchange.info);
    }

    this.supportedExchanges = Object.freeze(supportedExchanges);
  }

  async getExchangeTradingPairs(exchangeName: string): Promise<string[]> {
    try {
      let tradingPairs =
        await this.exchangesCache.getTradingPairs(exchangeName);
      if (!tradingPairs) {
        const exchange = this.exchangeApiClientFactory.retrieve(exchangeName);
        await exchange.loadMarkets();

        tradingPairs = await exchange.getTradingPairs();
        tradingPairs = tradingPairs.filter((symbol) => {
          /**
           * Filter out pairs with weird names that highly-likely
           * won't be ever maked
           */

          const isWeirdPair = symbol
            .split('/')
            .some((token) => this.isWeirdSymbol(token));

          return !isWeirdPair;
        });

        await this.exchangesCache.setTradingPairs(exchangeName, tradingPairs);
      }

      return tradingPairs;
    } catch (error) {
      const errorMessage = 'Failed to load trading pairs for exchange';
      this.logger.error(errorMessage, {
        exchangeName,
        error,
      });

      throw new Error(errorMessage);
    }
  }

  async getExchangeCurrencies(exchangeName: string): Promise<string[]> {
    try {
      let currencies = await this.exchangesCache.getCurrencies(exchangeName);
      if (!currencies) {
        const exchange = this.exchangeApiClientFactory.retrieve(exchangeName);
        await exchange.loadMarkets();

        currencies = await exchange.getCurrencies();
        currencies = currencies.filter((symbol) => {
          /**
           * Filter out tokens with weird names that highly-likely
           * won't be ever maked
           */
          const isWeirdSymbol = this.isWeirdSymbol(symbol);

          return !isWeirdSymbol;
        });

        /**
         * Adding manually some tokens in case they're not returned by the exchange
         */
        if (exchangeName === 'mexc') {
          const hmtSymbol = 'HMT';
          if (!currencies.includes(hmtSymbol)) {
            currencies.push(hmtSymbol);
          }
        }

        await this.exchangesCache.setCurrencies(exchangeName, currencies);
      }

      return currencies;
    } catch (error) {
      const errorMessage = 'Failed to load currencies for exchange';
      this.logger.error(errorMessage, {
        exchangeName,
        error,
      });

      throw new Error(errorMessage);
    }
  }

  private isWeirdSymbol(symbol: string): boolean {
    if (!symbol) {
      return true;
    }

    if (symbol.includes(':')) {
      return true;
    }

    if (symbol.includes('$')) {
      return true;
    }

    return symbol.length < 3 || symbol.length > 10;
  }
}
