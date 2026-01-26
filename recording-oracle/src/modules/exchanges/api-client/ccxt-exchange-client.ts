import * as ccxt from 'ccxt';
import type { Exchange } from 'ccxt';
import _ from 'lodash';

import {
  ETH_TOKEN_SYMBOL,
  ETH_USDT_PAIR,
  ExchangeName,
} from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import Environment from '@/common/utils/environment';
import logger from '@/logger';
import type { Logger } from '@/logger';

import * as ccxtClientUtils from './ccxt-exchange-client.utils';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { ExchangeApiAccessError, ExchangeApiClientError } from './errors';
import type {
  ExchangeApiClient,
  ExchangeApiClientInitOptions,
  ExchangeApiClientLoggingConfig,
} from './exchange-api-client.interface';
import {
  AccountBalance,
  ExchangePermission,
  Order,
  RequiredAccessCheckResult,
  Trade,
} from './types';

export interface CcxtExchangeClientInitOptions extends ExchangeApiClientInitOptions {
  sandbox?: boolean;
  preloadedExchangeClient?: Exchange;
}

function CatchApiAccessErrors(expectedPermission: ExchangePermission) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this: CcxtExchangeClient, ...args: unknown[]) => any
    >,
  ) {
    const original = descriptor.value!;

    descriptor.value = async function (
      this: CcxtExchangeClient,
      ...args: unknown[]
    ) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        error[ccxtClientUtils.ERROR_EXCHANGE_NAME_PROP] = this.exchangeName;
        if (ccxtClientUtils.isExchangeApiAccessError(error)) {
          if (this.loggingConfig.logPermissionErrors) {
            this.logger.info('Failed to access exchange API', {
              method: propertyKey,
              errorDetails: ccxtClientUtils.mapCcxtError(error),
            });
          }

          throw new ExchangeApiAccessError(
            this.exchangeName,
            expectedPermission,
            error.message,
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

async function permissionCheckHandler(
  checkPromise: Promise<unknown>,
): Promise<boolean> {
  try {
    await checkPromise;
    return true;
  } catch (error) {
    if (error instanceof ExchangeApiAccessError) {
      return false;
    }

    throw error;
  }
}

export class CcxtExchangeClient implements ExchangeApiClient {
  private ccxtClient: Exchange;
  readonly sandbox: boolean;
  readonly userId: string;
  readonly exchangeName: ExchangeName;

  protected logger: Logger;
  protected loggingConfig: ExchangeApiClientLoggingConfig = {
    logPermissionErrors: false,
  };

  constructor(
    exchangeName: string,
    {
      apiKey,
      secret,
      extraCreds,
      userId,
      sandbox,
      preloadedExchangeClient,
      loggingConfig,
    }: CcxtExchangeClientInitOptions,
  ) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported: ${exchangeName}`);
    }
    if (!userId) {
      throw new Error('userId is missing');
    }

    this.exchangeName = exchangeName as ExchangeName;
    this.userId = userId;

    const exchangeClass = ccxt[exchangeName];
    this.ccxtClient = new exchangeClass(
      _.merge({}, BASE_CCXT_CLIENT_OPTIONS, { apiKey, secret, ...extraCreds }),
    );
    if (preloadedExchangeClient) {
      this.ccxtClient.setMarketsFromExchange(preloadedExchangeClient);
    }

    this.sandbox = Boolean(sandbox);
    if (this.sandbox) {
      this.ccxtClient.setSandboxMode(true);
    }

    this.loggingConfig = {
      ...this.loggingConfig,
      ...loggingConfig,
    };
    this.logger = logger.child({
      context: CcxtExchangeClient.name,
      exchangeName,
      sandbox: this.sandbox,
      userId,
      apiKeyHash: cryptoUtils.hashString(apiKey),
    });
  }

  checkRequiredCredentials(): boolean {
    const hasAllRequiredCredentials =
      this.ccxtClient.checkRequiredCredentials(false);

    if (Environment.isDevelopment() && !hasAllRequiredCredentials) {
      const requiredCredentials: string[] = [];
      for (const credential in this.ccxtClient.requiredCredentials) {
        if (this.ccxtClient.requiredCredentials[credential]) {
          requiredCredentials.push(credential);
        }
      }
      this.logger.debug('Incomplete required credentials for exchange', {
        requiredCredentials,
      });
    }

    return hasAllRequiredCredentials;
  }

  async checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult> {
    const _permissionsToCheck = new Set(permissionsToCheck);
    if (_permissionsToCheck.size === 0) {
      throw new Error(
        'At least one exchange permission must be provided for check',
      );
    }

    try {
      const checkHandlersMap = new Map<
        ExchangePermission,
        ReturnType<typeof permissionCheckHandler>
      >();

      if (_permissionsToCheck.has(ExchangePermission.VIEW_ACCOUNT_BALANCE)) {
        checkHandlersMap.set(
          ExchangePermission.VIEW_ACCOUNT_BALANCE,
          permissionCheckHandler(this.fetchBalance()),
        );
      }

      if (_permissionsToCheck.has(ExchangePermission.VIEW_DEPOSIT_ADDRESS)) {
        checkHandlersMap.set(
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
          permissionCheckHandler(this.fetchDepositAddress(ETH_TOKEN_SYMBOL)),
        );
      }

      if (
        _permissionsToCheck.has(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
      ) {
        checkHandlersMap.set(
          ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
          permissionCheckHandler(this.fetchMyTrades(ETH_USDT_PAIR, Date.now())),
        );
      }

      /**
       * To ensure try/catch handlers error in any promise
       * and pre-resolve them
       */
      await Promise.all(Array.from(checkHandlersMap.values()));

      const missingPermissions: Array<ExchangePermission> = [];
      for (const [permission, checkResultPromise] of checkHandlersMap) {
        const hasPermission = await checkResultPromise;
        if (!hasPermission) {
          missingPermissions.push(permission);
        }
      }

      if (missingPermissions.length === 0) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        missing: missingPermissions,
      };
    } catch (error) {
      if (error instanceof ccxt.NetworkError) {
        const message = 'Error while checking exchange access';
        this.logger.error(message, error);
        throw new ExchangeApiClientError(message, this.exchangeName);
      }

      throw error;
    }
  }

  @CatchApiAccessErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  async fetchOpenOrders(symbol: string, since: number): Promise<Order[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const orders = await this.ccxtClient.fetchOpenOrders(symbol, since);

    return orders.map(ccxtClientUtils.mapCcxtOrder);
  }

  /**
   * Returns all historical trades, both for fully and partially filled orders,
   * i.e. returns historical data for actual buy/sell that happened.
   */
  @CatchApiAccessErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const trades = await this.ccxtClient.fetchMyTrades(symbol, since);

    return trades.map(ccxtClientUtils.mapCcxtTrade);
  }

  @CatchApiAccessErrors(ExchangePermission.VIEW_ACCOUNT_BALANCE)
  async fetchBalance(): Promise<AccountBalance> {
    const balance = await this.ccxtClient.fetchBalance();

    return balance;
  }

  @CatchApiAccessErrors(ExchangePermission.VIEW_DEPOSIT_ADDRESS)
  async fetchDepositAddress(symbol: string): Promise<string> {
    const fetchParams: Record<string, unknown> = {};

    switch (this.exchangeName) {
      case ExchangeName.GATE: {
        fetchParams.network = 'ERC20';
        break;
      }
      case ExchangeName.XT: {
        fetchParams.network = 'ETH';
        break;
      }
      case ExchangeName.BYBIT: {
        if (this.sandbox) {
          const currencies = await this.ccxtClient.fetchCurrencies();
          const networks = currencies[symbol]?.networks;
          if (!networks) {
            throw new Error(`No networks supported for ${symbol}`);
          }

          const networkNames = Object.keys(networks).sort();
          let depositNetwork: string | undefined;
          for (const networkName of networkNames) {
            if (networks[networkName]!.deposit) {
              depositNetwork = networkName;
              break;
            }
          }

          if (!depositNetwork) {
            throw new Error(`No deposit network for ${symbol}`);
          }

          fetchParams.network = depositNetwork;

          this.logger.debug(
            'Will call fetchDepositAddress for bybit with extra params',
            {
              params: fetchParams,
            },
          );
        }
        break;
      }
    }

    const response = await this.ccxtClient.fetchDepositAddress(
      symbol,
      fetchParams,
    );

    return response.address;
  }
}
