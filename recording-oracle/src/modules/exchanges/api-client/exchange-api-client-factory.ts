import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import type { Exchange as CcxtExchange } from 'ccxt';

import {
  SUPPORTED_EXCHANGE_NAMES,
  SupportedExchange,
} from '@/common/constants';
import { ExchangesConfigService, LoggingConfigService } from '@/config';
import logger from '@/logger';

import {
  CcxtExchangeClient,
  CcxtExchangeClientInitOptions,
} from './ccxt-exchange-client';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { IncompleteKeySuppliedError } from './errors';
import type {
  ExchangeApiClient,
  ExchangeApiClientInitOptions,
} from './exchange-api-client.interface';
import { ExchangeExtras } from './types';

const PRELOAD_CCXT_CLIENTS_INTERVAL = 1000 * 60 * 25; // 25m after previous load

type CreateExchangeApiClientInitOptions = Omit<
  ExchangeApiClientInitOptions,
  'extraCreds' | 'loggingConfig'
> & {
  extras?: ExchangeExtras;
};

@Injectable()
export class ExchangeApiClientFactory implements OnModuleInit, OnModuleDestroy {
  private readonly logger = logger.child({
    context: ExchangeApiClientFactory.name,
  });

  private preloadedCcxtClients: Map<SupportedExchange, CcxtExchange> =
    new Map();
  private preloadCcxtTimeoutId: NodeJS.Timeout;

  constructor(
    private readonly exchangesConfigService: ExchangesConfigService,
    private readonly loggingConfigService: LoggingConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.preloadCcxtClients();
  }

  async onModuleDestroy(): Promise<void> {
    clearTimeout(this.preloadCcxtTimeoutId);
  }

  protected async preloadCcxtClients(): Promise<void> {
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

  protected async preloadCcxtClient(
    exchangeName: SupportedExchange,
  ): Promise<void> {
    const logger = this.logger.child({ exchangeName });
    try {
      logger.debug('Preloading ccxt for exchange');
      let ccxtClient: CcxtExchange;
      if (this.preloadedCcxtClients.has(exchangeName)) {
        ccxtClient = this.preloadedCcxtClients.get(
          exchangeName,
        ) as CcxtExchange;
      } else {
        const exchangeClass = ccxt[exchangeName];
        ccxtClient = new exchangeClass({ ...BASE_CCXT_CLIENT_OPTIONS });
      }

      if (this.exchangesConfigService.useSandbox) {
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
      logger.error('Failed to preload ccxt for exchange', {
        error,
      });
    }
  }

  create(
    exchangeName: string,
    initOptions: CreateExchangeApiClientInitOptions,
  ): ExchangeApiClient {
    const clientInitOptions: CcxtExchangeClientInitOptions = {
      apiKey: initOptions.apiKey,
      secret: initOptions.secret,
      userId: initOptions.userId,
      sandbox: this.exchangesConfigService.useSandbox,
      preloadedExchangeClient: this.preloadedCcxtClients.get(
        exchangeName as SupportedExchange,
      ),
      loggingConfig: {
        logPermissionErrors:
          this.loggingConfigService.logExchangePermissionErrors,
      },
    };

    switch (exchangeName as SupportedExchange) {
      case 'bitmart':
        clientInitOptions.extraCreds = {
          uid: initOptions.extras?.apiKeyMemo as string,
        };
        break;
    }

    const ccxtExchangeClient = new CcxtExchangeClient(
      exchangeName,
      clientInitOptions,
    );
    if (ccxtExchangeClient.checkRequiredCredentials()) {
      return ccxtExchangeClient;
    } else {
      throw new IncompleteKeySuppliedError(exchangeName);
    }
  }
}
