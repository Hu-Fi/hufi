import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Exchange as CcxtExchange } from 'ccxt';
import * as ccxt from 'ccxt';
import ms from 'ms';

import { ExchangeName, ExchangeType } from '@/common/constants';
import { ExchangeNotSupportedError } from '@/common/errors/exchanges';
import {
  ExchangesConfigService,
  LoggingConfigService,
  Web3ConfigService,
} from '@/config';
import logger from '@/logger';

import { BigoneClient } from './bigone';
import {
  BASE_CCXT_CLIENT_OPTIONS,
  CcxtExchangeClient,
  CcxtExchangeClientInitOptions,
} from './ccxt';
import { IncompleteKeySuppliedError } from './errors';
import type {
  CexApiClientInitOptions,
  DexApiClientInitOptions,
  ExchangeApiClient,
} from './exchange-api-client.interface';
import { HyperliquidClient } from './hyperliquid';
import { PancakeswapClient } from './pancakeswap';
import { ExchangeExtras } from './types';

const PRELOAD_CCXT_CLIENTS_INTERVAL = ms('6 hours'); // ms after previous load

type CreateCexApiClientInitOptions = Omit<
  CexApiClientInitOptions,
  'extraCreds' | 'loggingConfig'
> & {
  extras?: ExchangeExtras;
};

type CreateDexApiClientInitOptions = Omit<
  DexApiClientInitOptions,
  'extraCreds' | 'loggingConfig'
> & {};

@Injectable()
export class ExchangeApiClientFactory implements OnModuleInit, OnModuleDestroy {
  private readonly logger = logger.child({
    context: ExchangeApiClientFactory.name,
  });

  private preloadedCcxtClients: Map<string, CcxtExchange> = new Map();
  private preloadCcxtTimeoutId: NodeJS.Timeout;

  constructor(
    private readonly exchangesConfigService: ExchangesConfigService,
    private readonly loggingConfigService: LoggingConfigService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.preloadCcxtClients();
  }

  async onModuleDestroy(): Promise<void> {
    clearTimeout(this.preloadCcxtTimeoutId);
  }

  protected async preloadCcxtClients(): Promise<void> {
    this.logger.debug('Started ccxt clients preloading');

    const exchangesToPreload: ExchangeName[] = [];
    for (const [exchangeName, exchangeConfig] of Object.entries(
      this.exchangesConfigService.configByExchange,
    )) {
      if (exchangeConfig.skipCcxtPreload) {
        continue;
      }

      if (exchangeConfig.enabled && exchangeConfig.type === ExchangeType.CEX) {
        exchangesToPreload.push(exchangeName as ExchangeName);
      }
    }

    await Promise.all(
      exchangesToPreload.map((exchange) => this.preloadCcxtClient(exchange)),
    );

    this.logger.debug('Finished ccxt clients preloading');

    this.preloadCcxtTimeoutId = setTimeout(
      () => this.preloadCcxtClients(),
      PRELOAD_CCXT_CLIENTS_INTERVAL,
    );
  }

  protected async preloadCcxtClient(exchangeName: string): Promise<void> {
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

      await ccxtClient.loadMarkets(true);

      this.preloadedCcxtClients.set(exchangeName, ccxtClient);
      logger.debug('Preloaded ccxt for exchange');
    } catch (error) {
      logger.error('Failed to preload ccxt for exchange', {
        error,
      });
    }
  }

  createCex(
    exchangeName: ExchangeName,
    initOptions: CreateCexApiClientInitOptions,
  ): ExchangeApiClient {
    const exchangeConfig =
      this.exchangesConfigService.configByExchange[exchangeName];
    if (exchangeConfig.type !== ExchangeType.CEX) {
      throw new Error('Provided exchange is not CEX');
    }

    let cexApiClient: ExchangeApiClient;

    const clientInitOptions: CcxtExchangeClientInitOptions = {
      apiKey: initOptions.apiKey,
      secret: initOptions.secret,
      userId: initOptions.userId,
      loggingConfig: {
        logPermissionErrors:
          this.loggingConfigService.logExchangePermissionErrors,
      },
      sandbox: this.exchangesConfigService.useSandbox,
      preloadedExchangeClient: this.preloadedCcxtClients.get(exchangeName),
    };

    if (exchangeName === ExchangeName.BIGONE) {
      cexApiClient = new BigoneClient(clientInitOptions);
    } else {
      /**
       * Add extra options per exchange if needed
       */
      switch (exchangeName) {
        case ExchangeName.BITMART: {
          clientInitOptions.extraCreds = {
            uid: initOptions.extras?.apiKeyMemo as string,
          };
          break;
        }
      }

      cexApiClient = new CcxtExchangeClient(exchangeName, clientInitOptions);
    }

    if (cexApiClient.checkRequiredCredentials()) {
      return cexApiClient;
    } else {
      throw new IncompleteKeySuppliedError(exchangeName);
    }
  }

  createDex(
    exchangeName: ExchangeName,
    initOptions: CreateDexApiClientInitOptions,
  ): ExchangeApiClient {
    const exchangeConfig =
      this.exchangesConfigService.configByExchange[exchangeName];
    if (exchangeConfig.type !== ExchangeType.DEX) {
      throw new Error('Provided exchange is not DEX');
    }

    const clientInitOptions: DexApiClientInitOptions = {
      userId: initOptions.userId,
      userEvmAddress: initOptions.userEvmAddress,
    };

    switch (exchangeName) {
      case ExchangeName.PANCAKESWAP: {
        return new PancakeswapClient({
          ...clientInitOptions,
          subgraphApiKey: this.web3ConfigService.subgraphApiKey,
        });
      }
      case ExchangeName.HYPERLIQUID: {
        return new HyperliquidClient({
          ...clientInitOptions,
          sandbox: this.exchangesConfigService.useSandbox,
        });
      }
      default:
        throw new ExchangeNotSupportedError(exchangeName);
    }
  }
}
