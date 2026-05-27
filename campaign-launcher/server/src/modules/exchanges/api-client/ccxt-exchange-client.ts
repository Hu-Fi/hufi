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

    let useSandbox = false;
    switch (exchangeName) {
      case ExchangeName.HYPERLIQUID: {
        perExchangeClientOptions = {
          options: {
            fetchMarkets: {
              types: ['spot'],
            },
          },
        };
        useSandbox = !Environment.isProduction();
        break;
      }
    }

    this.ccxtClient = new exchangeClass(
      _.merge({}, BASE_CCXT_CLIENT_OPTIONS, perExchangeClientOptions),
    );
    this.ccxtClient.setSandboxMode(useSandbox);
  }

  protected get tradingPairs() {
    return this.ccxtClient.symbols;
  }

  protected get currencies() {
    return Object.keys(this.ccxtClient.currencies || {});
  }

  protected async runLoadMarkets(): Promise<void> {
    await this.ccxtClient.loadMarkets(true);
  }
}
