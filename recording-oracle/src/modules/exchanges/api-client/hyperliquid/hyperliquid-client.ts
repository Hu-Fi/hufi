import type { Exchange } from 'ccxt';
import * as ccxt from 'ccxt';
import _ from 'lodash';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import type { Logger } from '@/logger';
import logger from '@/logger';

import { BASE_CCXT_CLIENT_OPTIONS } from '../ccxt';
import * as ccxtClientUtils from '../ccxt/utils';
import { ExchangeApiClientError } from '../errors';
import {
  type DexApiClientInitOptions,
  type ExchangeApiClient,
} from '../exchange-api-client.interface';
import { type RequiredAccessCheckResult, type Trade } from '../types';
import * as apiClientUtils from '../utils';
import { HYPERLIQUID_TRADES_PAGE_LIMIT } from './constants';

export interface HyperliquidClientInitOptions extends DexApiClientInitOptions {
  sandbox?: boolean;
  preloadedExchangeClient?: Exchange;
}

class HyperliquidClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.HYPERLIQUID);
  }
}

export class HyperliquidClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.HYPERLIQUID;
  readonly userId: string;
  readonly userEvmAddress: string;
  readonly sandbox: boolean;

  private readonly logger: Logger;
  private readonly ccxtClient: Exchange;

  constructor({
    userId,
    userEvmAddress,
    sandbox,
    preloadedExchangeClient,
  }: HyperliquidClientInitOptions) {
    if (!userId) {
      throw new Error('userId is missing');
    }
    if (!userEvmAddress) {
      throw new Error('userEvmAddress is missing');
    }

    this.userId = userId;
    this.userEvmAddress = userEvmAddress;
    this.sandbox = Boolean(sandbox);

    this.ccxtClient = new ccxt.hyperliquid(
      _.merge({}, BASE_CCXT_CLIENT_OPTIONS, {
        options: {
          defaultType: 'spot',
        },
      }),
    );
    if (preloadedExchangeClient) {
      this.ccxtClient.setMarketsFromExchange(preloadedExchangeClient);
    }
    if (this.sandbox) {
      this.ccxtClient.setSandboxMode(true);
    }

    this.logger = logger.child({
      context: HyperliquidClient.name,
      exchangeName: this.exchangeName,
      userId,
      sandbox: this.sandbox,
    });
  }

  checkRequiredCredentials(): boolean {
    return Boolean(this.userId && this.userEvmAddress);
  }

  checkRequiredAccess(): Promise<RequiredAccessCheckResult> {
    return Promise.resolve({ success: true });
  }

  async *fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]> {
    if (!apiClientUtils.isAcceptableTimestamp(since)) {
      throw new Error('"since" must be a ms timestamp in acceptable range');
    }

    if (!apiClientUtils.isAcceptableTimestamp(until)) {
      throw new Error('"until" must be a ms timestamp in acceptable range');
    }

    if (until < since) {
      throw new Error('"until" must be greater than or equal to "since"');
    }

    try {
      let fetchTradesSince = since;

      while (fetchTradesSince < until) {
        const trades = await this.ccxtClient.fetchMyTrades(
          symbol,
          fetchTradesSince,
          HYPERLIQUID_TRADES_PAGE_LIMIT,
          {
            user: this.userEvmAddress,
            until,
          },
        );
        if (trades.length === 0) {
          break;
        }

        yield trades.map(ccxtClientUtils.mapCcxtTrade);

        const lastTradeTimestamp = trades.at(-1)!.timestamp;

        fetchTradesSince = lastTradeTimestamp + 1;
      }
    } catch (error) {
      const message = 'Failed to fetch trades';
      this.logger.error(message, {
        symbol,
        since,
        until,
        error: ccxtClientUtils.mapCcxtError(error),
      });
      throw new HyperliquidClientError(message);
    }
  }

  fetchBalance(): never {
    throw new MethodNotImplementedError();
  }

  fetchDepositAddress(): never {
    throw new MethodNotImplementedError();
  }
}
