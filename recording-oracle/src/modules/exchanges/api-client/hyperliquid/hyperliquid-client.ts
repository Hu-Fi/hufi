import type { Exchange } from 'ccxt';
import * as ccxt from 'ccxt';
import { ethers } from 'ethers';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import type { Logger } from '@/logger';
import logger from '@/logger';

import * as ccxtClientUtils from '../ccxt/utils';
import { ExchangeApiClientError } from '../errors';
import {
  type DexApiClientInitOptions,
  type ExchangeApiClient,
} from '../exchange-api-client.interface';
import { type RequiredAccessCheckResult, type Trade } from '../types';
import * as apiClientUtils from '../utils';
import {
  BASE_HYPERLIQUID_CLIENT_OPTIONS,
  HYPERLIQUID_TRADES_PAGE_LIMIT,
} from './constants';

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

    /**
     * For the application use shared preloaded ccxt client,
     * so that we can rely on ccxt's internal rate-limiter.
     * It's necessary because Hyperliquid's rate-limit is IP-based.
     */
    if (preloadedExchangeClient) {
      this.ccxtClient = preloadedExchangeClient;
      this.sandbox = preloadedExchangeClient.isSandboxModeEnabled;
    } else {
      this.ccxtClient = new ccxt.hyperliquid({
        ...BASE_HYPERLIQUID_CLIENT_OPTIONS,
      });
      this.sandbox = Boolean(sandbox);
      this.ccxtClient.setSandboxMode(this.sandbox);
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

    try {
      /**
       * At max 10k fills available atm, so it's fine to
       * store all ids for deduplication instead of moving slice
       * of limited size.
       */
      const dedupTradeIds = new Set<string>();

      let fetchTradesSince = since;
      do {
        const trades = await this.ccxtClient.fetchMyTrades(
          symbol,
          fetchTradesSince,
          HYPERLIQUID_TRADES_PAGE_LIMIT,
          {
            user: this.userEvmAddress,
            /**
             * https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#retrieve-a-users-fills-by-time
             * Both "since" and "until" are inclusive in API
             */
            until: until - 1,
          },
        );

        const newTrades: Trade[] = [];
        for (const trade of trades) {
          const mappedTrade = ccxtClientUtils.mapCcxtTrade(trade);

          if (dedupTradeIds.has(mappedTrade.id)) {
            continue;
          }

          dedupTradeIds.add(mappedTrade.id);
          newTrades.push(mappedTrade);
        }

        if (newTrades.length === 0) {
          break;
        }

        yield newTrades;

        fetchTradesSince = newTrades.at(-1)!.timestamp;
      } while (dedupTradeIds.size > 0); // safety-belt if adding accidentally removed
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

  async fetchDepositAddress(): Promise<string> {
    return ethers.getAddress(this.userEvmAddress);
  }
}
