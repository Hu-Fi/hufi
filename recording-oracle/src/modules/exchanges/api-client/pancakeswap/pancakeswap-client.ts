import assert from 'assert';
import { setTimeout as delay } from 'timers/promises';

import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import type { Logger } from '@/logger';
import logger from '@/logger';

import { ExchangeApiClientError } from '../errors';
import {
  type DexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import type { RequiredAccessCheckResult, Trade } from '../types';
import * as apiClientUtils from '../utils';
import {
  ACCEPTED_SYNC_DELAY_MS,
  MAX_LOOKBACK_MS,
  tokenAddressBySymbol,
} from './constants';
import {
  GET_ACCOUNT_SWAPS_QUERY,
  GET_LATEST_SWAPS_QUERY,
  GET_SUBGRAPH_META_QUERY,
  type LatestSwapData,
  type SubgraphMeta,
  type SubgraphSwapData,
} from './queries';
import type { LatestBlockData, Swap } from './types';
import * as pancakeswapUtils from './utils';

type PancakeswapClientInitOptions = DexApiClientInitOptions & {
  subgraphUrl: string;
  subgraphApiKey: string;
};

class PancakeswapClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.PANCAKESWAP);
  }
}

export class PancakeswapClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.PANCAKESWAP;
  readonly graphClient: GraphQLClient;
  readonly userId: string;
  readonly userEvmAddress: string;

  protected logger: Logger;

  constructor({
    userId,
    userEvmAddress,
    subgraphUrl,
    subgraphApiKey,
  }: PancakeswapClientInitOptions) {
    assert(subgraphUrl, 'subgraphUrl is required');
    assert(subgraphApiKey, 'subgraphApiKey is required');
    assert(userEvmAddress, 'userEvmAddress is required');

    this.userId = userId;
    this.userEvmAddress = userEvmAddress;

    this.graphClient = new GraphQLClient(subgraphUrl, {
      headers: {
        Authorization: `Bearer ${subgraphApiKey}`,
      },
    });

    this.logger = logger.child({
      context: PancakeswapClient.name,
      exchangeName: this.exchangeName,
      userId,
    });
  }

  async fetchSubgraphMeta(): Promise<SubgraphMeta> {
    try {
      const { _meta } = await this.graphClient.request<{
        _meta: SubgraphMeta;
      }>(GET_SUBGRAPH_META_QUERY);

      return _meta;
    } catch (error) {
      const message = 'Failed to fetch subgraph meta';
      this.logger.error(message, {
        error: pancakeswapUtils.formatGraphqlRequestError(error as Error),
      });
      throw new PancakeswapClientError(message);
    }
  }

  /**
   * @param timestamp value in seconds
   */
  private async assertSubgraphNotStale(timestamp: number): Promise<void> {
    const subgraphMeta = await this.fetchSubgraphMeta();

    if (subgraphMeta.hasIndexingErrors) {
      throw new PancakeswapClientError('Subgraph has indexing errors');
    }

    if (subgraphMeta.block.timestamp < timestamp) {
      throw new PancakeswapClientError('Subgraph is stale');
    }
  }

  async fetchActualBlockData(producedAfter?: number): Promise<LatestBlockData> {
    try {
      const afterMs = producedAfter ?? Date.now() - ACCEPTED_SYNC_DELAY_MS;

      const { latestSwaps } = await this.graphClient.request<{
        latestSwaps: LatestSwapData[];
      }>(GET_LATEST_SWAPS_QUERY, {
        after: dayjs(afterMs).unix(),
      });

      if (latestSwaps.length === 0) {
        throw new Error(`No swaps after ${new Date(afterMs).toISOString()}`);
      }

      const { blockNumber, timestamp } = latestSwaps[0];
      return {
        number: Number(blockNumber),
        timestamp: Number(timestamp) * 1000,
      };
    } catch (error) {
      const message = 'Failed to fetch actual block data';
      this.logger.error(message, {
        error: pancakeswapUtils.formatGraphqlRequestError(error as Error),
      });
      throw new PancakeswapClientError(message);
    }
  }

  private async fetchSwaps(
    tokenIn: string,
    tokenOut: string,
    since: number,
    until: number,
    options: {
      skip?: number;
      blockNumber?: number;
    },
  ): Promise<Swap[]> {
    const { swaps } = await this.graphClient.request<{
      swaps: SubgraphSwapData[];
    }>(GET_ACCOUNT_SWAPS_QUERY, {
      account: this.userEvmAddress.toLowerCase(),
      tokenIn: tokenIn.toLowerCase(),
      tokenOut: tokenOut.toLowerCase(),
      since,
      until,
      skip: options.skip || 0,
      block: options.blockNumber
        ? {
            number_gte: options.blockNumber,
          }
        : undefined,
    });

    return swaps.map(pancakeswapUtils.mapSubgraphDataToSwap);
  }

  checkRequiredCredentials(): boolean {
    return true;
  }

  checkRequiredAccess(): Promise<RequiredAccessCheckResult> {
    return Promise.resolve({ success: true });
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

    const msToUntil = Date.now() - until;
    if (msToUntil < ACCEPTED_SYNC_DELAY_MS) {
      const keepUpMs = ACCEPTED_SYNC_DELAY_MS - msToUntil;
      this.logger.warn(
        `Provided "until" timestamp is too recent, adding delay to avoid errors`,
        {
          until,
          keepUpMs,
        },
      );
      await delay(keepUpMs);
    }

    const sinceSeconds = dayjs(since).unix();
    const untilSeconds = dayjs(until).unix() + 1;

    /**
     * We must ensure that queries land to graph nodes that have data up to "until" timestamp,
     * so we get the first block number produced after "until" and then use it as a reference
     * in subsequent time-travel queries, so TheGraph LB can exclude stale indexers.
     * Ref: https://thegraph.com/docs/en/subgraphs/querying/distributed-systems/#polling-for-updated-data
     * Previous option: rely on subgraph meta's latest block timestamp, but use exact indexer URL,
     * so we make sure requests land to the same node.
     *
     * Otherwise, we may end up in a situation when we query for swaps in a block
     * that is not yet indexed by the node and get empty results, while the same
     * query to another node would return the data.
     */
    // await this.assertSubgraphNotStale(untilSeconds); // previous option
    const latestBlockData = await this.fetchActualBlockData(until);

    try {
      const [baseTokenSymbol, quoteTokenSymbol] = symbol.split('/');

      const baseTokenAddress = tokenAddressBySymbol[baseTokenSymbol];
      if (!baseTokenAddress) {
        throw new PancakeswapClientError(
          'Missing token address for base token',
        );
      }
      const quoteTokenAddress = tokenAddressBySymbol[quoteTokenSymbol];
      if (!quoteTokenAddress) {
        throw new PancakeswapClientError(
          'Missing token address for quote token',
        );
      }

      let nBuySwaps = 0;
      let nSellSwaps = 0;
      do {
        let fetchBuySwapsPromise: Promise<Swap[]>;
        if (nBuySwaps === -1) {
          fetchBuySwapsPromise = Promise.resolve([]);
        } else {
          fetchBuySwapsPromise = this.fetchSwaps(
            quoteTokenAddress,
            baseTokenAddress,
            sinceSeconds,
            untilSeconds,
            { skip: nBuySwaps, blockNumber: latestBlockData.number },
          );
        }

        let fetchSellSwapsPromise: Promise<Swap[]>;
        if (nSellSwaps === -1) {
          fetchSellSwapsPromise = Promise.resolve([]);
        } else {
          fetchSellSwapsPromise = this.fetchSwaps(
            baseTokenAddress,
            quoteTokenAddress,
            sinceSeconds,
            untilSeconds,
            { skip: nSellSwaps, blockNumber: latestBlockData.number },
          );
        }

        const [buySwaps, sellSwaps] = await Promise.all([
          fetchBuySwapsPromise,
          fetchSellSwapsPromise,
        ]);
        if (buySwaps.length === 0) {
          nBuySwaps = -1;
        } else {
          nBuySwaps += buySwaps.length;
        }
        if (sellSwaps.length === 0) {
          nSellSwaps = -1;
        } else {
          nSellSwaps += sellSwaps.length;
        }

        const allSwaps = _.orderBy(
          [...buySwaps, ...sellSwaps],
          'timestamp',
          'asc',
        );

        const mappedSwaps = allSwaps.map((swap) =>
          pancakeswapUtils.mapSwap(swap, symbol, quoteTokenAddress),
        );
        if (mappedSwaps.length > 0) {
          yield mappedSwaps;
        } else {
          break;
        }
      } while (true);
    } catch (error) {
      const message = 'Failed to fetch trades';
      this.logger.error(message, {
        error: pancakeswapUtils.formatGraphqlRequestError(error as Error),
        symbol,
        since,
      });
      throw new PancakeswapClientError(message);
    }
  }

  fetchBalance(): never {
    throw new MethodNotImplementedError();
  }

  async fetchDepositAddress(): Promise<string> {
    return ethers.getAddress(this.userEvmAddress);
  }
}
