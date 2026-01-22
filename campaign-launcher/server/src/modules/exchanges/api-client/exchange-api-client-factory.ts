import { Injectable } from '@nestjs/common';

import { ExchangeName } from '@/common/constants';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import type { ExchangeApiClient } from './exchange-api-client.interface';
import { PancakeSwapClient } from './pancakeswap-client';

@Injectable()
export class ExchangeApiClientFactory {
  private clientInstances: Map<string, ExchangeApiClient> = new Map();

  retrieve(exchangeName: string): ExchangeApiClient {
    if (!this.clientInstances.has(exchangeName)) {
      let client: ExchangeApiClient;
      switch (exchangeName) {
        case ExchangeName.PANCAKESWAP:
          client = new PancakeSwapClient();
          break;
        default:
          client = new CcxtExchangeClient(exchangeName);
          break;
      }

      this.clientInstances.set(exchangeName, client);
    }

    return this.clientInstances.get(exchangeName)!;
  }
}
