import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { GraphQLClient, ClientError } from 'graphql-request';
import _ from 'lodash';

import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import logger from '@/logger';
import type { Logger } from '@/logger';

import {
  MAX_ALLOWED_DELAY,
  MAX_PAGE_SIZE,
  PANCAKESWAP_BSC_SUBGRAPH,
  tokenAddressBySymbol,
} from './constants';
import { GET_LATEST_SWAP_QUERY, GET_MAKER_SWAPS_QUERY } from './queries';
import type { LatestSwap, MakerSwap } from './queries';
import { ExchangeApiClientError } from '../errors';
import {
  type DexApiClientInitOptions,
  ExchangeApiClient,
} from '../exchange-api-client.interface';
import {
  TakerOrMakerFlag,
  TradingSide,
  type RequiredAccessCheckResult,
  type Trade,
} from '../types';

type PancakeswapClientInitOptions = DexApiClientInitOptions & {
  subgraphApiKey: string;
};

class PancakeswapClientError extends ExchangeApiClientError {
  constructor(message: string) {
    super(message, ExchangeName.PANCAKESWAP);
  }
}

function formatGraphqlRequestError(error: Error) {
  const formattedError: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof ClientError) {
    formattedError.stack = 'omit';
    formattedError.message = 'Graph client error';
    formattedError.response = error.response;
  }

  return formattedError;
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

  private async assertSubgraphNotStale(): Promise<void> {
    const {
      swaps: [latestSwap],
    } = await this.graphClient.request<{ swaps: [LatestSwap?] }>(
      GET_LATEST_SWAP_QUERY,
    );

    if (!latestSwap) {
      throw new PancakeswapClientError('No swaps data on subgraph');
    }

    const latestSwapTs = Number(latestSwap.timestamp) * 1000;
    if (dayjs().diff(latestSwapTs, 'seconds') > MAX_ALLOWED_DELAY) {
      throw new PancakeswapClientError('Subgraph is stale');
    }
  }

  private async fetchSwaps(tokenIn: string, tokenOut: string, since: number) {
    const { swaps } = await this.graphClient.request<{
      swaps: MakerSwap[];
    }>(GET_MAKER_SWAPS_QUERY, {
      maker: this.userEvmAddress.toLowerCase(),
      tokenIn: tokenIn.toLowerCase(),
      tokenOut: tokenOut.toLowerCase(),
      since,
    });

    return swaps.map((swap) => {
      const timestamp = Number(swap.timestamp);

      return {
        hash: swap.hash,
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

  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    await this.assertSubgraphNotStale();

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

      const sinceSeconds = Math.ceil(since / 1000);
      const [buySwaps, sellSwaps] = await Promise.all([
        this.fetchSwaps(quoteTokenAddress, baseTokenAddress, sinceSeconds),
        this.fetchSwaps(baseTokenAddress, quoteTokenAddress, sinceSeconds),
      ]);

      const allSwaps = _.orderBy(
        [...buySwaps, ...sellSwaps],
        'timestamp',
        'asc',
      );

      return allSwaps.slice(0, MAX_PAGE_SIZE).map((swap) => {
        const trade: Trade = {
          id: swap.hash,
          timestamp: swap.timestamp * 1000,
          symbol,
          side:
            swap.tokenIn === quoteTokenAddress
              ? TradingSide.BUY
              : TradingSide.SELL,
          takerOrMaker: TakerOrMakerFlag.TAKER,
          amount: -1,
          cost: -1,
          price: -1,
        };

        if (trade.side === TradingSide.BUY) {
          trade.amount = swap.amountOut;
          trade.cost = swap.amountIn;
        } else {
          trade.amount = swap.amountIn;
          trade.cost = swap.amountOut;
        }

        trade.price = trade.cost / trade.amount;

        return trade;
      });
    } catch (error) {
      const message = 'Failed to fetch trades';
      this.logger.error(message, {
        error: formatGraphqlRequestError(error as Error),
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
