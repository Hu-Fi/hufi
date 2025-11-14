import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import type { Exchange as CcxtExchange } from 'ccxt';

import {
  SUPPORTED_EXCHANGE_NAMES,
  SupportedExchange,
} from '@/common/constants';
import { ExchangeConfigService } from '@/config';
import logger from '@/logger';

import { CcxtExchangeClient } from './ccxt-exchange-client';
import type {
  ExchangeApiClient,
  ExchangeApiClientInitOptions,
} from './exchange-api-client.interface';

const PRELOAD_CCXT_CLIENTS_INTERVAL = 1000 * 60 * 7; // 7 minutes after previous load

@Injectable()
export class ExchangeApiClientFactory implements OnModuleInit, OnModuleDestroy {
  private readonly logger = logger.child({
    context: ExchangeApiClientFactory.name,
  });

  private preloadedCcxtClients: Map<SupportedExchange, CcxtExchange> =
    new Map();
  private preloadCcxtTimeoutId: NodeJS.Timeout;

  constructor(private readonly exchangeConfigService: ExchangeConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.preloadCcxtClients();
  }

  async onModuleDestroy(): Promise<void> {
    clearTimeout(this.preloadCcxtTimeoutId);
  }

  async preloadCcxtClients(): Promise<void> {
    this.logger.debug('Started ccxt clients preloading');

    await Promise.all(
      SUPPORTED_EXCHANGE_NAMES.map((exchange) =>
        this.preloadCcxtClient(exchange),
      ),
    );

    this.logger.debug('Finished ccxt clients preloading');

    this.preloadCcxtTimeoutId = setTimeout(
      () => this.preloadCcxtClients(),
      PRELOAD_CCXT_CLIENTS_INTERVAL,
    );
  }

  async preloadCcxtClient(exchangeName: SupportedExchange): Promise<void> {
    const logger = this.logger.child({ exchangeName });
    try {
      logger.debug('Preloading ccxt for exchange');
      const exchangeClass = ccxt[exchangeName];
      const ccxtClient = new exchangeClass({});

      if (this.exchangeConfigService.useSandbox) {
        if (ccxtClient.has.sandbox) {
          ccxtClient.setSandboxMode(true);
        } else {
          logger.debug('Skip ccxt preloading due to lack of sandbox');
          return;
        }
      }

      await ccxtClient.loadMarkets();

      this.preloadedCcxtClients.set(exchangeName, ccxtClient);
      logger.debug('Preloaded ccxt for exchange');
    } catch (error) {
      this.logger.error('Failed to preload ccxt for exchange', {
        error,
      });
    }
  }

  create(
    exchangeName: string,
    initOptions: ExchangeApiClientInitOptions,
  ): ExchangeApiClient {
    return new CcxtExchangeClient(exchangeName, {
      ...initOptions,
      sandbox: this.exchangeConfigService.useSandbox,
      preloadedExchangeClient: this.preloadedCcxtClients.get(
        exchangeName as SupportedExchange,
      ),
    });
  }
}
