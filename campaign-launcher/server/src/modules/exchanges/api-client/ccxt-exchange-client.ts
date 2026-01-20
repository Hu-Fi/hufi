import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';
import _ from 'lodash';

import { BaseExchangeApiClient } from './base-client';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { type ExchangeInfo } from './exchange-api-client.interface';
import { ExchangeType } from '../constants';

export class CcxtExchangeClient extends BaseExchangeApiClient {
  private ccxtClient: Exchange;
  protected marketsLoadedAt: number = 0;

  constructor(exchangeName: string) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported by ccxt: ${exchangeName}`);
    }

    super(exchangeName);

    const exchangeClass = ccxt[exchangeName];
    this.ccxtClient = new exchangeClass(_.merge({}, BASE_CCXT_CLIENT_OPTIONS));
  }

  get info(): ExchangeInfo {
    return {
      name: this.exchangeName,
      displayName: this.ccxtClient.name,
      url: this.ccxtClient.urls.www,
      logo: this.ccxtClient.urls.logo,
      type: ExchangeType.CEX,
    };
  }

  get marketsLoaded(): boolean {
    return Object.keys(this.ccxtClient.markets || {}).length > 0;
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
