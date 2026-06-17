import crypto from 'crypto';

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
} from './constants';
import { KucoinApiError, KucoinClientError } from './error';

export type KucoinClientInitOptions = Omit<
  CexApiClientInitOptions,
  'extraCreds'
> & {
  extraCreds: {
    passphrase: string;
  };
};

function kcSign(plain: Buffer, key: Buffer): string {
  return crypto
    .createHmac('sha256', key)
    .update(plain)
    .digest()
    .toString('base64');
}
/**
 * TODO:
 * - response types
 * - add error handling
 * - add decorator for permissions errors
 * - fetch trades from both spot and margin
 * - check 401 & 403 when accessing wrong endpoint/wrong perm or wrong sign and etc;
 */
export class KucoinClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.BIGONE;
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
      kcSign(Buffer.from(extraCreds.passphrase), this.secret);

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
    { params, data }: Pick<AxiosRequestConfig, 'params' | 'data'> = {},
  ): Record<string, string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const queryParams = new URLSearchParams(params).toString();
    const _path = queryParams ? `${path}?${queryParams}` : path;

    const _body = data ? JSON.stringify(data) : '';

    const timestamp = Date.now().toString();

    const toSign = timestamp + method + _path + _body;
    return {
      'KC-API-KEY': this.apiKey,
      'KC-API-PASSPHRASE': this.passphrase,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-SIGN': kcSign(Buffer.from(toSign), this.secret),
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
        let message: string;
        if (responseData.code) {
          message = `${responseData.code}: ${responseData.msg}`;
        } else {
          message = response.status.toString();
        }
        throw new KucoinApiError(message);
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

    this.logger.debug('fetchMyTrades called with', {
      symbol,
      since,
      until,
    });
    yield [];
  }

  async fetchBalance(): Promise<AccountBalance> {
    const data = await this.makeRequest<
      Array<{
        currency: string;
        balance: string;
        available: string;
        holds: string;
      }>
    >('GET', '/api/v1/accounts', {
      params: {
        type: 'trade',
      },
    });

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

  async fetchDepositAddress(symbol: string): Promise<string> {
    const data = await this.makeRequest<
      Array<{
        address: string;
        chainId: string;
        to: string;
        expirationDate: number;
        currency: string;
        contractAddress: string;
        chainName: string;
      }>
    >('GET', '/api/v3/deposit-addresses', {
      params: {
        currency: symbol,
        chain: DEPOSIT_ADDRESS_NETWORK,
      },
    });

    if (data.length === 0) {
      throw new Error(`No deposit address found for ${symbol}`);
    }

    return data[0].address;
  }
}
