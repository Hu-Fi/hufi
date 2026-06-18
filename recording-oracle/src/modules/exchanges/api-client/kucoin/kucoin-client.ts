import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';

import { ExchangeName } from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import * as httpUtils from '@/common/utils/http';
import type { Logger } from '@/logger';
import logger from '@/logger';

import type {
  CexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import {
  type AccountBalance,
  ExchangePermission,
  type RequiredAccessCheckResult,
  type Trade,
} from '../types';
import * as apiClientUtils from '../utils';
import {
  API_TIMEOUT,
  BASE_API_URL,
  DEPOSIT_ADDRESS_NETWORK,
  MAX_LOOKBACK_MS,
  MAX_PAGE_SIZE,
} from './constants';
import {
  KucoinApiAccessError,
  KucoinApiError,
  KucoinClientError,
} from './error';
import { ApiAccount, ApiDepositAddress, ApiSpotTrade } from './types';
import * as kucoinUtils from './utils';

export type KucoinClientInitOptions = Omit<
  CexApiClientInitOptions,
  'extraCreds'
> & {
  extraCreds: {
    passphrase: string;
  };
};

function CatchApiPermissionErrors(expectedPermission: ExchangePermission) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this: KucoinClient, ...args: any[]) => any
    >,
  ) {
    const original = descriptor.value!;

    descriptor.value = async function (this: KucoinClient, ...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        if (kucoinUtils.isApiPermissionError(error)) {
          if (this.loggingConfig.logPermissionErrors) {
            this.logger.info('Failed to access exchange API', {
              method: propertyKey,
              errorDetails: {
                message: error.message,
                code: error.code,
              },
            });
          }

          throw new KucoinApiAccessError(expectedPermission, error.message);
        }

        throw error;
      }
    };

    return descriptor;
  };
}
/**
 * TODO:
 * - check error handling
 * - invalid timestamp in signature
 * - check 401 & 403 when accessing wrong endpoint/wrong perm or wrong sign and etc;
 */
export class KucoinClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.KUCOIN;
  readonly apiClient: AxiosInstance;

  private readonly apiKey: string;
  private readonly secret: Buffer;
  private readonly passphrase: string;
  readonly userId: string;

  protected logger: Logger;
  protected loggingConfig: NonNullable<
    CexApiClientInitOptions['loggingConfig']
  > = {
    logPermissionErrors: false,
  };

  constructor({
    apiKey,
    secret,
    extraCreds,
    userId,
    loggingConfig,
    sandbox,
  }: KucoinClientInitOptions) {
    if (sandbox) {
      throw new Error(`Sandbox mode is not supported for ${this.exchangeName}`);
    }

    if (!userId) {
      throw new Error('userId is missing');
    }

    this.userId = userId;
    this.apiKey = apiKey;
    this.secret = Buffer.from(secret);
    this.passphrase =
      extraCreds.passphrase &&
      kucoinUtils.kcSign(Buffer.from(extraCreds.passphrase), this.secret);

    this.apiClient = axios.create({
      baseURL: BASE_API_URL,
      timeout: API_TIMEOUT,
    });

    this.loggingConfig = {
      ...this.loggingConfig,
      ...loggingConfig,
    };
    this.logger = logger.child({
      context: KucoinClient.name,
      exchangeName: this.exchangeName,
      userId,
      apiKeyHash: cryptoUtils.hashString(apiKey),
    });
  }

  checkRequiredCredentials(): boolean {
    if (this.apiKey && this.secret.length && this.passphrase) {
      return true;
    }

    return false;
  }

  private createAuthHeaders(
    method: string,
    path: string,
    { params = {}, data }: Pick<AxiosRequestConfig, 'params' | 'data'> = {},
  ): Record<string, string> {
    const rawQuery = kucoinUtils.getRawQuery(params as Record<string, unknown>);
    const _path = rawQuery ? `${path}?${rawQuery}` : path;

    const _body = data ? JSON.stringify(data) : '';

    const timestamp = Date.now().toString();

    const toSign = timestamp + method + _path + _body;
    return {
      'KC-API-KEY': this.apiKey,
      'KC-API-PASSPHRASE': this.passphrase,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-SIGN': kucoinUtils.kcSign(Buffer.from(toSign), this.secret),
      'KC-API-KEY-VERSION': '3',
    };
  }

  private async makeRequest<T = unknown>(
    method: 'GET',
    path: string,
    options: Pick<AxiosRequestConfig, 'params' | 'data'> = {},
  ): Promise<T> {
    try {
      const response = await this.apiClient.request<{
        code: string;
        data?: unknown;
        msg?: string;
      }>({
        method,
        url: path,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.createAuthHeaders(method, path, options),
        },
        validateStatus: () => true,
      });

      const responseData = response.data;
      if (response.status > 299 || responseData.code !== '200000') {
        throw new KucoinApiError(
          responseData.code || response.status.toString(),
          responseData.msg || response.statusText,
        );
      }

      return responseData.data as T;
    } catch (error) {
      if (error instanceof KucoinApiError) {
        throw error;
      }

      let formattedError = error;
      if (error instanceof AxiosError) {
        formattedError = httpUtils.formatAxiosError(error);
      }

      const errorMessage = 'Failed to make API request';
      this.logger.error(errorMessage, {
        error: formattedError,
        path,
      });

      throw new KucoinClientError(errorMessage);
    }
  }

  checkRequiredAccess(
    _permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult> {
    throw new Error('Method not implemented.');
  }

  /**
   * Just a wrapper to correctly apply class decorators
   * w/o necessity to handle "Promise or Generator" cases
   * in decorator itself
   */
  @CatchApiPermissionErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async _fetchMySpotTrades(
    symbol: string,
    since: number,
    until: number,
    nextPageToken?: number,
  ) {
    /**
     * Data returned in reverse-chronological order
     */
    const { items, lastId } = await this.makeRequest<{
      lastId: number;
      items: ApiSpotTrade[];
    }>('GET', '/api/v1/hf/fills', {
      params: {
        symbol,
        startAt: since,
        endAt: until,
        lastId: nextPageToken,
        limit: MAX_PAGE_SIZE,
      },
    });

    return {
      items,
      nextPageToken: items.length === MAX_PAGE_SIZE ? lastId : undefined,
    };
  }

  async *fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]> {
    if (!apiClientUtils.isAcceptableTimestamp(since, MAX_LOOKBACK_MS)) {
      throw new Error('"since" must be a ms timestamp in acceptable range');
    }

    if (!apiClientUtils.isAcceptableTimestamp(until, MAX_LOOKBACK_MS)) {
      throw new Error('"until" must be a ms timestamp in acceptable range');
    }

    const kcSymbol = kucoinUtils.mapSymbolToKcSymbol(symbol);
    const _until = until - 1; // API is inclusive

    let nextPageToken: number | undefined;
    let apiTrades: ApiSpotTrade[];
    do {
      ({ items: apiTrades, nextPageToken } = await this._fetchMySpotTrades(
        kcSymbol,
        since,
        _until,
        nextPageToken,
      ));

      /**
       * It might be that last page size is exactly MAX_PAGE_SIZE, but
       * there are no more trades to fetch. In this case we should stop
       * and avoid yielding empty array.
       */
      if (apiTrades.length === 0) {
        break;
      }

      const mappedTrades: Trade[] = [];
      for (const apiTrade of apiTrades) {
        mappedTrades.push(kucoinUtils.mapTrade(apiTrade));
      }
      yield mappedTrades;
    } while (nextPageToken);
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_ACCOUNT_BALANCE)
  async fetchBalance(): Promise<AccountBalance> {
    const data = await this.makeRequest<ApiAccount[]>(
      'GET',
      '/api/v1/accounts',
      {
        params: {
          type: 'trade',
        },
      },
    );

    const accountBalance: AccountBalance = {};

    for (const assetBalance of data) {
      accountBalance[assetBalance.currency] = {
        total: Number(assetBalance.balance),
        free: Number(assetBalance.available),
        used: Number(assetBalance.holds),
      };
    }

    return accountBalance;
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_DEPOSIT_ADDRESS)
  async fetchDepositAddress(symbol: string): Promise<string> {
    try {
      const data = await this.makeRequest<ApiDepositAddress[]>(
        'GET',
        '/api/v3/deposit-addresses',
        {
          params: {
            currency: symbol,
            chain: DEPOSIT_ADDRESS_NETWORK,
          },
        },
      );

      const fundingAddressInfo = data.find((d) => d.to === 'MAIN');
      if (!fundingAddressInfo) {
        throw new KucoinApiAccessError(
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
          `No deposit address for ${symbol}`,
        );
      }

      return fundingAddressInfo.address;
    } catch (error) {
      if (error instanceof KucoinApiError && error.code === '114001') {
        throw new KucoinApiAccessError(
          ExchangePermission.VIEW_DEPOSIT_ADDRESS,
          `Deposit disabled for ${symbol}`,
        );
      }

      throw error;
    }
  }
}
