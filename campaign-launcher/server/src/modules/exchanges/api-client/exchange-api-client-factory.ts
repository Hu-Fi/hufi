import { Injectable } from '@nestjs/common';

import { ExchangeName, type SupportedExchange } from '@/common/constants';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import type { ExchangeApiClient } from './exchange-api-client.interface';
import { PancakeSwapClient } from './pancakeswap-client';

@Injectable()
export class ExchangeApiClientFactory {
  private clientInstances: Map<SupportedExchange, ExchangeApiClient> =
    new Map();

  constructor() {}

  retrieve(exchangeName: string): ExchangeApiClient {
    if (!this.clientInstances.has(exchangeName as SupportedExchange)) {
      let client: ExchangeApiClient;
      switch (exchangeName) {
        case ExchangeName.PANCAKESWAP:
          client = new PancakeSwapClient();
          break;
        default:
          client = new CcxtExchangeClient(exchangeName);
          break;
      }

      this.clientInstances.set(exchangeName as SupportedExchange, client);
    }

    return this.clientInstances.get(exchangeName as SupportedExchange)!;
  }
}
