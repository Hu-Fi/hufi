import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import jwt from 'jsonwebtoken';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import * as cryptoUtils from '@/common/utils/crypto';
import * as httpUtils from '@/common/utils/http';
import logger from '@/logger';
import type { Logger } from '@/logger';

import {
  CexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import {
  ExchangePermission,
  RequiredAccessCheckResult,
  type Trade,
  type AccountBalance,
} from '../types';
import * as apiClientUtils from '../utils';
import {
  API_TIMEOUT,
  BASE_API_URL,
  DEPOSIT_ADDRESS_NETWORK,
  MAX_LOOKBACK_MS,
} from './constants';
import { BigoneAccessError, BigoneClientError } from './error';
import {
  type ApiSpotAccountBalance,
  type ApiTrade,
  type ApiDepositAddress,
} from './types';
import * as bigoneUtils from './utils';

type BigoneClientInitOptions = Omit<CexApiClientInitOptions, 'extraCreds'>;

export class BigoneClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.BIGONE;
  readonly apiClient: AxiosInstance;

  private readonly apiKey: string;
  private readonly secret: string;
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
    userId,
    loggingConfig,
  }: BigoneClientInitOptions) {
    if (!userId) {
      throw new Error('userId is missing');
    }

    this.userId = userId;
    this.apiKey = apiKey;
    this.secret = secret;

    this.apiClient = axios.create({
      baseURL: BASE_API_URL,
      timeout: API_TIMEOUT,
    });

    this.loggingConfig = {
      ...this.loggingConfig,
      ...loggingConfig,
    };
    this.logger = logger.child({
      context: BigoneClient.name,
      exchangeName: this.exchangeName,
      userId,
      apiKeyHash: cryptoUtils.hashString(apiKey),
    });
  }

  private createAuthToken(): string {
    /**
     * Generate nonce in nanoseconds
     * https://open.big.one/docs/general-info#timestamps
     * https://open.big.one/docs/authentication#javascript
     */
    const nonce = (BigInt(Date.now()) * BigInt(1000000)).toString();

    const authToken = jwt.sign(
      {
        type: 'OpenAPIV2',
        sub: this.apiKey,
        nonce: nonce,
      },
      this.secret,
      { algorithm: 'HS256' },
    );

    return authToken;
  }

  private async makeRequest<T = unknown>(
    method: 'GET',
    path: string,
    options: Pick<AxiosRequestConfig, 'params' | 'data'> = {},
  ): Promise<T> {
    try {
      const response = await this.apiClient.request<T>({
        method,
        url: path,
        ...options,
        headers: {
          Authorization: `Bearer ${this.createAuthToken()}`,
        },
      });

      return response.data;
    } catch (error) {
      let formattedError = error;
      if (error instanceof AxiosError) {
        formattedError = httpUtils.formatAxiosError(error);
      }

      const errorMessage = 'Failed to make API request';
      this.logger.error(errorMessage, {
        error: formattedError,
        path,
      });

      throw new BigoneClientError(errorMessage);
    }
  }

  checkRequiredCredentials(): boolean {
    if (!this.apiKey || !this.secret) {
      return false;
    }

    return true;
  }

  checkRequiredAccess(
    _permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult> {
    throw new Error('Method not implemented.');
  }

  fetchOpenOrders(): never {
    throw new MethodNotImplementedError();
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

    const assetPairName = bigoneUtils.mapSymbolToAssetPair(symbol);
    const sinceIso = new Date(since).toISOString();
    const untilIso = new Date(until).toISOString();

    let nextPageToken: string | undefined;
    let apiTrades: ApiTrade[];
    do {
      ({ data: apiTrades, page_token: nextPageToken } = await this.makeRequest<{
        data: ApiTrade[];
        page_token?: string;
      }>('GET', 'viewer/trades', {
        params: {
          asset_pair_name: assetPairName,
          page_token: nextPageToken,
          limit: 200, // max page size
        },
      }));

      const mappedTrades = [];
      for (const apiTrade of apiTrades) {
        if (apiTrade.created_at >= sinceIso && apiTrade.created_at < untilIso) {
          mappedTrades.push(bigoneUtils.mapTrade(apiTrade));
        }
      }
      if (mappedTrades.length) {
        yield mappedTrades;
      }

      const oldestApiTrade = apiTrades.at(-1);
      if (oldestApiTrade && oldestApiTrade.created_at < sinceIso) {
        /**
         * To avoid useless pagination after we return all trades in range
         */
        break;
      }
    } while (nextPageToken);
  }

  async fetchBalance(): Promise<AccountBalance> {
    const { data } = await this.makeRequest<{
      data: ApiSpotAccountBalance[];
    }>('GET', 'viewer/accounts');

    const accountBalance: AccountBalance = {};

    for (const assetBalance of data) {
      const total = Number(assetBalance.balance);
      const used = Number(assetBalance.locked_balance);

      accountBalance[assetBalance.asset_symbol] = {
        free: total - used,
        used,
        total,
      };
    }

    return accountBalance;
  }

  async fetchDepositAddress(symbol: string): Promise<string> {
    const { data } = await this.makeRequest<{
      data: ApiDepositAddress[];
    }>('GET', `viewer/assets/${symbol}/address`);

    const address = data.find(
      (d) => d.chain === DEPOSIT_ADDRESS_NETWORK,
    )?.value;
    if (!address) {
      /**
       * If no deposit address for symbol - it returns empty array
       */
      throw new BigoneAccessError(
        ExchangePermission.VIEW_DEPOSIT_ADDRESS,
        `No deposit address for ${symbol} on ${DEPOSIT_ADDRESS_NETWORK}`,
      );
    }

    return address;
  }
}
