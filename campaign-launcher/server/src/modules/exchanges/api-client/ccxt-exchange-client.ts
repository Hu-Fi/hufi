import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';
import _ from 'lodash';

import { ExchangeName } from '@/common/constants';
import Environment from '@/common/utils/environment';

import { BaseExchangeApiClient } from './base-client';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';

export class CcxtExchangeClient extends BaseExchangeApiClient {
  private ccxtClient: Exchange;

  constructor(exchangeName: string) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported by ccxt: ${exchangeName}`);
    }

    super(exchangeName);

    const exchangeClass = ccxt[exchangeName];
    let perExchangeClientOptions: Record<string, unknown> = {};

    switch (exchangeName) {
      case ExchangeName.BYBIT:
      case ExchangeName.GATE:
      case ExchangeName.HYPERLIQUID: {
        perExchangeClientOptions = {
          options: {
            fetchMarkets: {
              types: ['spot'],
            },
          },
        };
        break;
      }
      case ExchangeName.HTX: {
        perExchangeClientOptions = {
          options: {
            fetchMarkets: {
              types: {
                spot: true,
                linear: false,
                inverse: false,
              },
            },
          },
        };
        break;
      }
      case ExchangeName.BIGONE:
      case ExchangeName.BITMART:
      case ExchangeName.MEXC:
      case ExchangeName.XT:
      default: {
        /**
         * Not possible to configure markets via options for some exchanges,
         * so will have to filter them out after fetching.
         *
         * Even though we filter out later, keep config for those exchanges that support it
         * to reduce the amount of data fetched from the exchange and also fetch correct currencies.
         */
        break;
      }
    }

    this.ccxtClient = new exchangeClass(
      _.merge({}, BASE_CCXT_CLIENT_OPTIONS, perExchangeClientOptions),
    );
    if (
      Environment.isProduction() === false &&
      this.ccxtClient.has['sandbox']
    ) {
      this.ccxtClient.setSandboxMode(true);
    }
  }

  protected get tradingPairs() {
    const spotTradingPairs: string[] = [];

    for (const marketInfo of Object.values(this.ccxtClient.markets)) {
      if (marketInfo.type === 'spot') {
        spotTradingPairs.push(marketInfo.symbol as string);
      }
    }

    return spotTradingPairs;
  }

  protected get currencies() {
    return Object.keys(this.ccxtClient.currencies || {});
  }

  protected async runLoadMarkets(): Promise<void> {
    await this.ccxtClient.loadMarkets(true);
  }
}
