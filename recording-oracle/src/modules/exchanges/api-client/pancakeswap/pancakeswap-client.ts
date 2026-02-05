import { ethers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import _ from 'lodash';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import logger from '@/logger';
import type { Logger } from '@/logger';

import {
  MAX_LOOKBACK_MS,
  PANCAKESWAP_BSC_SUBGRAPH,
  tokenAddressBySymbol,
} from './constants';
import {
  GET_LATEST_SWAP_QUERY,
  GET_ACCOUNT_SWAPS_QUERY,
  type SubgraphSwapData,
} from './queries';
import { type Swap } from './types';
import * as pancakeswapUtils from './utils';
import { ExchangeApiClientError } from '../errors';
import {
  type DexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import { type RequiredAccessCheckResult, type Trade } from '../types';
import * as apiClientUtils from '../utils';

type PancakeswapClientInitOptions = DexApiClientInitOptions & {
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
    subgraphApiKey,
  }: PancakeswapClientInitOptions) {
    this.userId = userId;
    this.userEvmAddress = userEvmAddress;

    this.graphClient = new GraphQLClient(PANCAKESWAP_BSC_SUBGRAPH, {
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

  private async assertSubgraphNotStale(timestamp: number): Promise<void> {
    let latestSwap: SubgraphSwapData | undefined;

    try {
      const { swaps } = await this.graphClient.request<{
        swaps: [SubgraphSwapData?];
      }>(GET_LATEST_SWAP_QUERY, {
        timestamp,
      });

      latestSwap = swaps[0];
    } catch (error) {
      const message = 'Failed to fetch latest swap';
      this.logger.error(message, {
        error: pancakeswapUtils.formatGraphqlRequestError(error as Error),
      });
      throw new PancakeswapClientError(message);
    }

    if (!latestSwap) {
      throw new PancakeswapClientError('Subgraph is stale');
    }
  }

  private async fetchSwaps(
    tokenIn: string,
    tokenOut: string,
    since: number,
    until: number,
    skip: number = 0,
  ): Promise<Swap[]> {
    const { swaps } = await this.graphClient.request<{
      swaps: SubgraphSwapData[];
    }>(GET_ACCOUNT_SWAPS_QUERY, {
      account: this.userEvmAddress.toLowerCase(),
      tokenIn: tokenIn.toLowerCase(),
      tokenOut: tokenOut.toLowerCase(),
      since,
      until,
      skip,
    });

    return swaps.map((swap) => {
      const timestamp = Number(swap.timestamp);

      return {
        id: swap.id,
        hash: swap.hash,
        nonce: swap.nonce,
        timestamp,
        amountIn: Number(
          ethers.formatUnits(swap.amountIn, swap.tokenIn.decimals),
        ),
        amountOut: Number(
          ethers.formatUnits(swap.amountOut, swap.tokenOut.decimals),
        ),
        tokenIn: swap.tokenIn.id,
        tokenOut: swap.tokenOut.id,
      };
    });
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

    const sinceSeconds = Math.floor(since / 1000);
    const untilSeconds = Math.ceil(until / 1000);

    await this.assertSubgraphNotStale(untilSeconds);

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
            nBuySwaps,
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
            nSellSwaps,
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

  fetchOpenOrders(): never {
    throw new MethodNotImplementedError();
  }

  fetchBalance(): never {
    throw new MethodNotImplementedError();
  }

  fetchDepositAddress(): never {
    throw new MethodNotImplementedError();
  }
}
