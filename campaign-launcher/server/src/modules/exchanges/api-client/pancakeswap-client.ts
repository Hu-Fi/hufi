import { ExchangeName } from '@/common/constants';

import { BaseExchangeApiClient } from './base-client';
import { type ExchangeInfo } from './exchange-api-client.interface';

export class PancakeSwapClient extends BaseExchangeApiClient {
  constructor() {
    super(ExchangeName.PANCAKESWAP);
  }

  get info(): ExchangeInfo {
    return {
      name: this.exchangeName,
      displayName: 'PancakeSwap',
      url: 'https://pancakeswap.finance/swap',
      logo: 'https://tokens.pancakeswap.finance/images/symbol/cake.png',
      type: this.exchangeMeta.type,
    };
  }

  protected async runLoadMarkets(): Promise<void> {
    return;
  }

  protected get tradingPairs() {
    return ['HMT/USDT'];
  }

  protected get currencies() {
    return [];
  }
}
