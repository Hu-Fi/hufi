import crypto from 'crypto';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

import { ETH_TOKEN_SYMBOL, ExchangeName } from '@/common/constants';
import * as cryptoUtils from '@/common/utils/crypto';
import type { Logger } from '@/logger';
import logger from '@/logger';

import type {
  CexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import {
  ExchangePermission,
  RequiredAccessCheckResult,
  type AccountBalance,
  type Trade,
} from '../types';
import * as apiClientUtils from '../utils';
import {
  API_KEY_HEADER,
  API_SIGNATURE_HEADER,
  BASE_API_URL,
  DEPOSIT_METHODS,
} from './constants';
import {
  ApiPermissionError,
  KrakenApiAccessError,
  KrakenClientError,
} from './error';
import type {
  DepositAddressesResponse,
  ExtendedBalanceResponse,
} from './types';
import * as krakenUtils from './utils';

type KrakenClientInitOptions = Omit<CexApiClientInitOptions, 'extraCreds'>;

function CatchApiPermissionErrors(expectedPermission: ExchangePermission) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this: KrakenClient, ...args: any[]) => any
    >,
  ) {
    const original = descriptor.value!;

    descriptor.value = async function (this: KrakenClient, ...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        if (error instanceof ApiPermissionError) {
          if (this.loggingConfig.logPermissionErrors) {
            this.logger.info('Failed to access exchange API', {
              method: propertyKey,
              errorDetails: error,
            });
          }

          throw new KrakenApiAccessError(expectedPermission, error.message);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

export class KrakenClient implements ExchangeApiClient {
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
    sandbox,
  }: KrakenClientInitOptions) {
    if (sandbox) {
      throw new Error(`Sandbox mode is not supported for ${this.exchangeName}`);
    }

    if (!userId) {
      throw new Error('userId is missing');
    }

    this.userId = userId;
    this.apiKey = apiKey;
    this.secret = secret;

    this.apiClient = axios.create({
      baseURL: BASE_API_URL,
    });

    this.loggingConfig = {
      ...this.loggingConfig,
      ...loggingConfig,
    };
    this.logger = logger.child({
      context: KrakenClient.name,
      exchangeName: this.exchangeName,
      userId,
      apiKeyHash: cryptoUtils.hashString(apiKey),
    });
  }

  checkRequiredCredentials(): boolean {
    if (!this.apiKey || !this.secret) {
      return false;
    }

    return true;
  }

  private getRequestSignature(
    path: string,
    body: Record<string, unknown>,
    nonce: string,
  ): string {
    let bodyString = '';
    if (Object.keys(body).length > 0) {
      bodyString = JSON.stringify(body);
    }

    const nonceAndBodyHash = crypto
      .createHash('sha256')
      .update(nonce + bodyString)
      .digest('binary');

    return crypto
      .createHmac('sha512', Buffer.from(this.secret, 'base64'))
      .update(path + nonceAndBodyHash, 'binary')
      .digest('base64');
  }

  private async makeRequest<T = unknown>(
    method: 'POST',
    path: string,
    options: Pick<AxiosRequestConfig, 'params' | 'data'> = {},
  ): Promise<T> {
    /**
     * Nonce is scoped per API-key and does not reset,
     * so in case if we use monotonic clock we will have to store
     * last used value in some distributed storage.
     *
     * We aren't going to make same-ms requests, so it should be fine.
     * If we are - then we can request to increase "nonce window" in
     * API key settings.
     *
     * TODO: rethink "out of order" requests, probably by controlling
     * the flow to always have one in-flight request.
     */
    const nonce: string = Date.now().toString();
    const payload: Record<string, unknown> = Object.assign(
      {
        nonce,
      },
      options.data || {},
    );

    const _path = path.startsWith('/') ? path : `/${path}`;
    const signature = this.getRequestSignature(_path, payload, nonce);

    try {
      const response = await this.apiClient.request<ArrayBuffer>({
        method,
        url: _path,
        params: options.params,
        data: payload,
        headers: {
          [API_KEY_HEADER]: this.apiKey,
          [API_SIGNATURE_HEADER]: signature,
        },
        validateStatus: () => true,
        responseType: 'arraybuffer',
      });

      let responseData;
      if (response.headers['content-type'] === 'application/json') {
        responseData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
      } else {
        responseData = Buffer.from(response.data);
      }

      if (response.status > 299 || responseData.error?.length > 0) {
        const responseErrorCode: string =
          responseData.error?.[0] || response.status;

        if (krakenUtils.isApiPermissionCode(responseErrorCode)) {
          throw new ApiPermissionError(responseErrorCode);
        }

        throw new KrakenClientError('API request error', responseErrorCode);
      }

      if (responseData.result) {
        return responseData.result as T;
      } else {
        return responseData as T;
      }
    } catch (error) {
      console.error('Unexpected kraken request error', error);
      throw new Error('Kraken API request failed');
    }
  }

  async checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult> {
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
      [ExchangePermission.VIEW_SPOT_TRADING_HISTORY]: () =>
        apiClientUtils.permissionCheckHandler(
          this.makeRequest('POST', '/0/private/ExportStatus', {
            data: {
              report: 'trades',
            },
          }),
        ),
    };

    return await apiClientUtils.checkRequiredAccess(
      permissionsToCheck,
      permissionCheckHandlers,
    );
  }

  /**
   * Just a wrapper to correctly apply class decorators
   * w/o necessity to handle "Promise or Generator" cases
   * in decorator itself
   */
  @CatchApiPermissionErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async _fetchMyTrades() {
    throw new Error('Method not implemented.');
  }

  fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]> {
    throw new Error('Method not implemented.');
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_ACCOUNT_BALANCE)
  async fetchBalance(): Promise<AccountBalance> {
    const balances = await this.makeRequest<ExtendedBalanceResponse>(
      'POST',
      '/0/private/BalanceEx',
    );

    const accountBalance: AccountBalance = {};
    for (const [asset, amounts] of Object.entries(balances)) {
      const balance = Number(amounts.balance);
      const credit = Number(amounts.credit || '0');
      const credit_used = Number(amounts.credit_used || '0');
      const hold_trade = Number(amounts.hold_trade);

      const total = balance;
      const free = balance + credit - credit_used - hold_trade;
      accountBalance[asset] = {
        total,
        free,
        used: total - free,
      };
    }
    return accountBalance;
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_DEPOSIT_ADDRESS)
  async fetchDepositAddress(symbol: string): Promise<string> {
    const depositMethod = DEPOSIT_METHODS[symbol];
    if (!depositMethod) {
      throw new Error(`Deposit method for ${symbol} is not defined`);
    }

    const data = await this.makeRequest<DepositAddressesResponse>(
      'POST',
      '/0/private/DepositAddresses',
      {
        data: {
          asset: symbol,
          method: depositMethod,
        },
      },
    );

    const depositAddress = data?.[0]?.address;
    if (!depositAddress) {
      /**
       * If no deposit address for symbol - it returns empty array
       */
      throw new KrakenApiAccessError(
        ExchangePermission.VIEW_DEPOSIT_ADDRESS,
        `No deposit address for ${symbol} on ${depositMethod}`,
      );
    }

    return depositAddress;
  }
}
