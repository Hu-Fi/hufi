import type { Exchange, Trade as CcxtTrade } from 'ccxt';
import * as ccxt from 'ccxt';
import _ from 'lodash';

import {
  ETH_TOKEN_SYMBOL,
  ETH_USDT_PAIR,
  ExchangeName,
} from '@/common/constants';
import * as controlFlow from '@/common/utils/control-flow';
import * as cryptoUtils from '@/common/utils/crypto';
import Environment from '@/common/utils/environment';
import type { Logger } from '@/logger';
import logger from '@/logger';

import { ExchangeApiAccessError, ExchangeApiClientError } from '../errors';
import type {
  CexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import {
  AccountBalance,
  ExchangePermission,
  RequiredAccessCheckResult,
  Trade,
} from '../types';
import * as apiClientUtils from '../utils';
import { BASE_CCXT_CLIENT_OPTIONS } from './constants';
import { getPagionationHelpers } from './pagination-helpers';
import * as ccxtClientUtils from './utils';

export interface CcxtExchangeClientInitOptions extends CexApiClientInitOptions {
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

export class CcxtExchangeClient implements ExchangeApiClient {
  private ccxtClient: Exchange;
  readonly sandbox: boolean;
  readonly userId: string;
  readonly exchangeName: ExchangeName;

  protected logger: Logger;
  protected loggingConfig: NonNullable<
    CexApiClientInitOptions['loggingConfig']
  > = {
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
    try {
      const permissionCheckHandlers: Record<
        ExchangePermission,
        () => Promise<boolean>
      > = {
        [ExchangePermission.VIEW_ACCOUNT_BALANCE]: () =>
          apiClientUtils.permissionCheckHandler(this.fetchBalance()),
        [ExchangePermission.VIEW_DEPOSIT_ADDRESS]: () =>
          apiClientUtils.permissionCheckHandler(
            this.fetchDepositAddress(ETH_TOKEN_SYMBOL),
          ),
        [ExchangePermission.VIEW_SPOT_TRADING_HISTORY]: () => {
          const now = Date.now();

          return apiClientUtils.permissionCheckHandler(
            controlFlow.consumeIteratorOnce(
              this.fetchMyTrades(ETH_USDT_PAIR, now - 1, now),
            ),
          );
        },
      };

      return await apiClientUtils.checkRequiredAccess(
        permissionsToCheck,
        permissionCheckHandlers,
      );
    } catch (error) {
      if (error instanceof ccxt.NetworkError) {
        const message = 'Error while checking exchange access';
        this.logger.error(message, error);
        throw new ExchangeApiClientError(message, this.exchangeName);
      }

      throw error;
    }
  }

  /**
   * Just a wrapper to correctly apply class decorators
   * w/o necessity to handle "Promise or Generator" cases
   * in decorator itself
   */
  @CatchApiAccessErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async _fetchMyTrades(
    symbol: string,
    inputs: { since: number; until: number; nextPageToken?: unknown },
  ): Promise<{ trades: CcxtTrade[]; nextPageToken?: unknown }> {
    const { getPaginationInput, handlePaginationResponse } =
      getPagionationHelpers(this.exchangeName);

    const { since, params, limit } = getPaginationInput(
      inputs.since,
      inputs.until,
      inputs.nextPageToken,
    );

    let trades = await this.ccxtClient.fetchMyTrades(
      symbol,
      since,
      limit,
      params,
    );
    if (trades.length === 0) {
      return { trades: [] };
    }

    /**
     * APIs usually return it in desc order, but
     * ccxt under the hood reverses it.
     */
    trades = _.orderBy(trades, 'timestamp', 'desc');

    return handlePaginationResponse({
      trades,
      ccxtClient: this.ccxtClient,
      paginationParams: params,
      currentPageToken: inputs.nextPageToken,
    });
  }

  /**
   * Returns all historical trades, both for fully and partially filled orders,
   * i.e. returns historical data for actual buy/sell that happened.
   */
  async *fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]> {
    let trades: CcxtTrade[];
    let nextPageToken: unknown;

    do {
      ({ trades, nextPageToken } = await this._fetchMyTrades(symbol, {
        since,
        until,
        nextPageToken,
      }));

      if (trades.length === 0) {
        break;
      } else {
        yield trades.map(ccxtClientUtils.mapCcxtTrade);
      }
    } while (nextPageToken);
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
      case ExchangeName.BIGONE: {
        fetchParams.network = 'Ethereum';
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
