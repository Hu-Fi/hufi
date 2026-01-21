import { ExchangeName } from '@/common/constants';

import { BaseExchangeApiClient } from './base-client';

export class PancakeSwapClient extends BaseExchangeApiClient {
  constructor() {
    super(ExchangeName.PANCAKESWAP);
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
