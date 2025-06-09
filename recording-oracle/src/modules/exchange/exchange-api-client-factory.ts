import { Injectable } from '@nestjs/common';

import Environment from '@/utils/environment';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import { ExchangeApiClient, ExchangeApiClientInitOptions } from './types';

@Injectable()
export class ExchangeApiClientFactory {
  constructor() {}

  create(
    exchangeName: string,
    initOptions: ExchangeApiClientInitOptions,
  ): ExchangeApiClient {
    return new CcxtExchangeClient(exchangeName, {
      ...initOptions,
      sandbox: Environment.isDevelopment(),
    });
  }
}
