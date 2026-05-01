import crypto from 'crypto';
import { setTimeout as delay } from 'timers/promises';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';
import { parse as csvParse } from 'csv-parse';

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
  ExchangePermission,
  RequiredAccessCheckResult,
  type AccountBalance,
  type Trade,
} from '../types';
import * as apiClientUtils from '../utils';
import {
  API_KEY_HEADER,
  API_SIGNATURE_HEADER,
  API_TIMEOUT,
  BASE_API_URL,
  DEPOSIT_METHODS,
  MIN_NONCE_WINDOW,
  PARSED_TRADES_BATCH_SIZE,
  REPORT_POLLING_INTERVAL,
  REPORT_POLLING_TIMEOUT,
} from './constants';
import {
  KrakenApiAccessError,
  KrakenApiError,
  KrakenApiKeyNonceWindowError,
  KrakenClientError,
} from './error';
import {
  ApiKeyPermission,
  type ApiKeyInfoResponse,
  type DepositAddressesResponse,
  type ExtendedBalanceResponse,
  type ReportCsvRow,
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
        if (krakenUtils.isApiPermissionError(error)) {
          if (this.loggingConfig.logPermissionErrors) {
            this.logger.info('Failed to access exchange API', {
              method: propertyKey,
              errorDetails: {
                message: error.message,
                code: error.code,
              },
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
  readonly exchangeName = ExchangeName.KRAKEN;
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
      timeout: API_TIMEOUT,
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
      const contentType = String(response.headers['content-type']);
      if (contentType.startsWith('application/json')) {
        responseData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
      } else {
        responseData = Buffer.from(response.data);
      }

      const errorInResponse: string = responseData.error?.[0] || '';
      // https://docs.kraken.com/api/docs/guides/spot-rest-intro#error-details
      if (response.status > 299 || errorInResponse.startsWith('E')) {
        throw new KrakenApiError(errorInResponse || response.status.toString());
      }

      if (responseData.result) {
        return responseData.result as T;
      } else {
        return responseData as T;
      }
    } catch (error) {
      if (error instanceof KrakenApiError) {
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
      throw new KrakenClientError(errorMessage);
    }
  }

  async checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult> {
    const apiKeyPermissions = new Set<string>();
    try {
      const { nonce_window, permissions } = await this.fetchApiKeyInfo();
      if (nonce_window < MIN_NONCE_WINDOW) {
        throw new KrakenApiKeyNonceWindowError(nonce_window);
      }

      for (const apiKeyPermission of permissions) {
        apiKeyPermissions.add(apiKeyPermission);
      }
    } catch (error) {
      if (
        krakenUtils.isApiPermissionError(error) ||
        error instanceof KrakenApiKeyNonceWindowError
      ) {
        if (this.loggingConfig.logPermissionErrors) {
          this.logger.info('Invalid API key configuration', {
            errorDetails: {
              message: error.message,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              code: error.code,
            },
          });
        }
        return {
          success: false,
          missing: permissionsToCheck,
        };
      }
      throw error;
    }

    const permissionCheckHandlers: Record<
      ExchangePermission,
      () => Promise<boolean>
    > = {
      [ExchangePermission.VIEW_ACCOUNT_BALANCE]: async () =>
        apiKeyPermissions.has(ApiKeyPermission.QUERY_FUNDS),
      [ExchangePermission.VIEW_DEPOSIT_ADDRESS]: async () =>
        apiKeyPermissions.has(ApiKeyPermission.QUERY_FUNDS),
      [ExchangePermission.VIEW_SPOT_TRADING_HISTORY]: async () =>
        [
          ApiKeyPermission.QUERY_OPEN_TRADES,
          ApiKeyPermission.QUERY_CLOSED_TRADES,
          ApiKeyPermission.EXPORT_DATA,
        ].every((perm) => apiKeyPermissions.has(perm)),
    };

    return apiClientUtils.checkRequiredAccess(
      permissionsToCheck,
      permissionCheckHandlers,
    );
  }

  private async fetchApiKeyInfo() {
    const apiKeyInfo = await this.makeRequest<ApiKeyInfoResponse>(
      'POST',
      '/0/private/GetApiKeyInfo',
    );

    return {
      ...apiKeyInfo,
      nonce_window: Number(apiKeyInfo.nonce_window),
    };
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async requestTradesReport(
    since: number,
    until: number,
  ): Promise<string> {
    /**
     * API is [starttm, endtm), but contains trade time in microseconds,
     * so use [since, until] seconds range to get all trades for boundary seconds
     * and filter out trades not within [since, until) ms range when processing report.
     */
    const starttm = Math.floor(since.valueOf() / 1000);
    const endtm = Math.ceil(until.valueOf() / 1000);

    const result = await this.makeRequest<{ id: string }>(
      'POST',
      '/0/private/AddExport',
      {
        data: {
          report: 'trades',
          fields: 'txid,time,pair,type,price,vol,cost,ordertype,misc',
          format: 'CSV',
          description: `HuFi Recording Oracle export at ${new Date().toISOString()}`,
          starttm,
          endtm,
        },
      },
    );

    return result.id;
  }

  /**
   * Just a wrapper to correctly apply class decorators
   * w/o necessity to handle "Promise or Generator" cases
   * in decorator itself
   */
  @CatchApiPermissionErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async fetchTradesReport(since: number, until: number) {
    const reportId = await this.requestTradesReport(since, until);

    let reportZip: Buffer | undefined;
    const reportPollingStartTime = Date.now();
    while (!reportZip) {
      const elapsedTime = Date.now() - reportPollingStartTime;
      if (elapsedTime > REPORT_POLLING_TIMEOUT) {
        const errorMessage = 'Report processing timeout exceeded';
        this.logger.error(errorMessage, {
          reportId,
          since,
          until,
        });
        throw new KrakenClientError(errorMessage);
      }

      await delay(REPORT_POLLING_INTERVAL);

      try {
        reportZip = await this.makeRequest<Buffer>(
          'POST',
          '/0/private/RetrieveExport',
          {
            data: { id: reportId },
          },
        );
      } catch (error) {
        if (krakenUtils.isReportNotReadyError(error)) {
          continue;
        }

        this.logger.error('Failed to fetch trades report', {
          reportId,
          since,
          until,
          error,
        });
        throw error;
      }
    }

    const reportCsvStream = await krakenUtils.unzipReportCsv(reportZip);
    return {
      id: reportId,
      parsedCsvStream: reportCsvStream.pipe(
        csvParse({
          delimiter: ',',
          columns: true,
        }),
      ) as AsyncIterable<ReportCsvRow>,
    };
  }

  @CatchApiPermissionErrors(ExchangePermission.VIEW_SPOT_TRADING_HISTORY)
  private async removeReport(reportId: string): Promise<void> {
    try {
      await this.makeRequest('POST', '/0/private/RemoveExport', {
        data: {
          id: reportId,
          /**
           * Assume we will be removing only processed reports,
           * otherwise we need to "close" instead if not processed yet.
           */
          type: 'delete',
        },
      });
    } catch (error) {
      this.logger.error('Failed to remove report', {
        reportId,
        error,
      });
    }
  }

  async *fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]> {
    const report = await this.fetchTradesReport(since, until);

    let trades: Trade[] = [];
    for await (const csvLine of report.parsedCsvStream) {
      if (csvLine.pair.indexOf('/') === -1) {
        /**
         * TradeHistory and report API have different formats for pair, e.g.:
         * - trade history: "CCDUSD"
         * - report: "CCD/USD"
         *
         * "BASE/QUOTE" is our common format for symbols, so have this safety-belt
         * to avoid potential loss of results due to unexpected format change.
         */
        throw new KrakenClientError(
          `Unexpected pair format in report: ${csvLine.pair}`,
        );
      }
      const trade = krakenUtils.mapReportRowToTrade(csvLine);
      if (trade.symbol !== symbol) {
        continue;
      }
      if (trade.timestamp < since || trade.timestamp >= until) {
        continue;
      }

      trades.push(trade);

      if (trades.length === PARSED_TRADES_BATCH_SIZE) {
        yield trades;
        trades = [];
      }
    }

    /**
     * Yield the remaining trades that didn't fill up the last batch
     * or all trades if the total number is less than the batch size.
     */
    if (trades.length > 0) {
      yield trades;
    }

    /**
     * We should cleanup after ourselves to avoid polluting UI for user
     * "await" this to ensure we also cleanup when fetching trades from some
     * script. It's fine because we have timeouts for it and it's fail-safe
     */
    await this.removeReport(report.id);
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
      const hold_trade = Number(amounts.hold_trade);

      accountBalance[asset] = {
        total: balance,
        free: balance - hold_trade,
        used: hold_trade,
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
