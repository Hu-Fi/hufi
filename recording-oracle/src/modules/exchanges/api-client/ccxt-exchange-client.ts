import * as ccxt from 'ccxt';
import type { Exchange, Order as CcxtOrder, Trade as CcxtTrade } from 'ccxt';
import _ from 'lodash';

import {
  ETH_TOKEN_SYMBOL,
  ETH_USDT_PAIR,
  SupportedExchange,
} from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import logger from '@/logger';
import type { Logger } from '@/logger';

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

interface InitOptions extends ExchangeApiClientInitOptions {
  sandbox?: boolean;
  preloadedExchangeClient?: Exchange;
}

export function mapCcxtOrder(order: CcxtOrder): Order {
  return {
    id: order.id,
    status: order.status,
    timestamp: order.timestamp,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    amount: order.amount,
    filled: order.filled,
    cost: order.cost,
  };
}

export function mapCcxtTrade(trade: CcxtTrade): Trade {
  return {
    id: trade.id,
    timestamp: trade.timestamp,
    symbol: trade.symbol,
    side: trade.side,
    takerOrMaker: trade.takerOrMaker,
    price: trade.price,
    amount: trade.amount,
    cost: trade.cost,
  };
}

function mapCcxtError(error: unknown) {
  if (error instanceof ccxt.BaseError || error instanceof Error) {
    return {
      name: error.constructor.name,
      message: error.message,
    };
  }

  return error;
}

const ERROR_EXCHANGE_NAME_PROP = Symbol(
  'extra "exchange name" property for ccxt error',
);

const ccxtApiAccessErrors = [
  ccxt.AccountNotEnabled,
  ccxt.AccountSuspended,
  ccxt.AuthenticationError,
  ccxt.BadSymbol,
  ccxt.PermissionDenied,
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExchangeApiAccessError(error: any) {
  if (
    ccxtApiAccessErrors.some(
      (ccxtApiAccessError) => error instanceof ccxtApiAccessError,
    )
  ) {
    return true;
  }

  if (!error) {
    return false;
  }

  switch (error[ERROR_EXCHANGE_NAME_PROP] as SupportedExchange) {
    case 'mexc': {
      // https://www.mexc.com/api-docs/spot-v3/general-info#error-code
      /**
       * This can be returned e.g. in case when api key is removed.
       * NOTE: after it's removed it's still valid for some time on their end
       */
      if (error.message.includes('10072')) {
        return true;
      }

      /**
       * This can happen in case case deposit address not exist,
       * so user will have to create one
       */
      if (
        error instanceof ccxt.InvalidAddress &&
        error.message.includes('cannot find a deposit address')
      ) {
        return true;
      }

      return false;
    }
    case 'gate': {
      /**
       * This can happen in case case deposit address not exist,
       * so user will have to create one
       */
      if (
        error instanceof ccxt.InvalidAddress &&
        error.message.includes('address is undefined')
      ) {
        return true;
      }

      return false;
    }
    default:
      return false;
  }
}

function CatchApiAccessErrors() {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
      (this: CcxtExchangeClient, ...args: unknown[]) => unknown
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
        error[ERROR_EXCHANGE_NAME_PROP] = this.exchangeName;
        if (isExchangeApiAccessError(error)) {
          if (this.loggingConfig.logPermissionErrors) {
            this.logger.info('Failed to access exchange API', {
              method: propertyKey,
              errorDetails: mapCcxtError(error),
            });
          }
          throw new ExchangeApiAccessError(
            `Api access failed for ${propertyKey}`,
            error.message,
          );
        }

        throw error;
      }
    };
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

  protected logger: Logger;
  protected loggingConfig: ExchangeApiClientLoggingConfig = {
    logPermissionErrors: false,
  };

  constructor(
    readonly exchangeName: string,
    {
      apiKey,
      secret,
      userId,
      sandbox,
      preloadedExchangeClient,
      loggingConfig,
    }: InitOptions,
  ) {
    if (!(exchangeName in ccxt)) {
      throw new Error(`Exchange not supported: ${exchangeName}`);
    }

    this.userId = userId;

    const exchangeClass = ccxt[exchangeName];
    this.ccxtClient = new exchangeClass(
      _.merge(BASE_CCXT_CLIENT_OPTIONS, { apiKey, secret }),
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
    return this.ccxtClient.checkRequiredCredentials(false);
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

      if (_permissionsToCheck.has(ExchangePermission.FETCH_BALANCE)) {
        checkHandlersMap.set(
          ExchangePermission.FETCH_BALANCE,
          permissionCheckHandler(this.fetchBalance()),
        );
      }

      if (_permissionsToCheck.has(ExchangePermission.FETCH_DEPOSIT_ADDRESS)) {
        checkHandlersMap.set(
          ExchangePermission.FETCH_DEPOSIT_ADDRESS,
          permissionCheckHandler(this.fetchDepositAddress(ETH_TOKEN_SYMBOL)),
        );
      }

      if (_permissionsToCheck.has(ExchangePermission.FETCH_MY_TRADES)) {
        checkHandlersMap.set(
          ExchangePermission.FETCH_MY_TRADES,
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
        throw new ExchangeApiClientError(message);
      }

      throw error;
    }
  }

  @CatchApiAccessErrors()
  async fetchOpenOrders(symbol: string, since: number): Promise<Order[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const orders = await this.ccxtClient.fetchOpenOrders(symbol, since);

    return orders.map(mapCcxtOrder);
  }

  /**
   * Returns all historical trades, both for fully and partially filled orders,
   * i.e. returns historical data for actual buy/sell that happened.
   */
  @CatchApiAccessErrors()
  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    /**
     * Use default value for "limit" because it varies
     * from exchange to exchange.
     */
    const trades = await this.ccxtClient.fetchMyTrades(symbol, since);

    return trades.map(mapCcxtTrade);
  }

  @CatchApiAccessErrors()
  async fetchBalance(): Promise<AccountBalance> {
    const balance = await this.ccxtClient.fetchBalance();

    return balance;
  }

  @CatchApiAccessErrors()
  async fetchDepositAddress(symbol: string): Promise<string> {
    const fetchParams: Record<string, unknown> = {};

    switch (this.exchangeName) {
      case 'gate': {
        fetchParams.network = 'ERC20';
        break;
      }
      case 'bybit': {
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
