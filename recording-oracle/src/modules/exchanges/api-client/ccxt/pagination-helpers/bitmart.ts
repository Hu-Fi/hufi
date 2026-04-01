import type { Trade as CcxtTrade } from 'ccxt';
import _ from 'lodash';

import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

export type BitmartNextPageToken = {
  oldestTradeAt: number;
  movingDedupIds: string[];
};

const PAGE_LIMIT = 200; // max allowed

export const getPaginationInput: GetPaginationInputFn<
  BitmartNextPageToken,
  PaginationParams
> = (since, until, nextPageToken) => {
  /**
   * Bitmart API is [since, until]
   */

  let pageEndTime: number;
  if (nextPageToken) {
    /**
     * Use timestamp as is in order to fetch all
     * trades with same-millisecond timestamp if any
     */
    pageEndTime = nextPageToken.oldestTradeAt;
  } else {
    pageEndTime = until - 1;
  }

  return {
    limit: PAGE_LIMIT,
    since: since,
    params: {
      endTime: pageEndTime,
    },
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  BitmartNextPageToken,
  PaginationParams
> = ({ trades, currentPageToken }) => {
  const movingDedupIds = new Set(currentPageToken?.movingDedupIds || []);

  /**
   * There might be same-millisecond trades, so we have to filter out duplicates
   */
  const newTrades: CcxtTrade[] = [];
  for (const trade of trades) {
    if (movingDedupIds.has(trade.id)) {
      continue;
    }

    newTrades.push(trade);
  }

  if (newTrades.length === 0) {
    return { trades: [] };
  }

  const nextPageToken: BitmartNextPageToken = {
    oldestTradeAt: newTrades.at(-1)!.timestamp,
    /**
     * Keep last two pages to detect if we stuck in situation
     * where there are more trades within same-millisecond than trades page limit.
     */
    movingDedupIds: [...movingDedupIds, ..._.map(newTrades, 'id')].slice(
      -1 * PAGE_LIMIT * 2,
    ),
  };

  return {
    trades: newTrades,
    nextPageToken,
  };
};
