import { Injectable } from '@nestjs/common';

import { ExchangeConfigService } from '@/config';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import { ExchangeApiClient, ExchangeApiClientInitOptions } from './types';

@Injectable()
export class ExchangeApiClientFactory {
  constructor(private readonly exchangeConfigService: ExchangeConfigService) {}

  create(
    exchangeName: string,
    initOptions: ExchangeApiClientInitOptions,
  ): ExchangeApiClient {
    return new CcxtExchangeClient(exchangeName, {
      ...initOptions,
      sandbox: this.exchangeConfigService.useSandbox,
    });
  }
}
