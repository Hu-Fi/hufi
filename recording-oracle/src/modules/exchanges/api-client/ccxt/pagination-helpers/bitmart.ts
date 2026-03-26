import type { Trade as CcxtTrade } from 'ccxt';
import _ from 'lodash';

import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

export type BitmartNextPageToken = {
  nextPageUntil: number;
  movingDedupIds: string[];
};

const PAGE_LIMIT = 200; // max allowed

export const getPaginationInput: GetPaginationInputFn<
  BitmartNextPageToken,
  PaginationParams
> = (since, until, nextPageToken) => {
  return {
    limit: PAGE_LIMIT,
    since: since,
    params: {
      endTime: nextPageToken?.nextPageUntil || until,
    },
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  BitmartNextPageToken,
  PaginationParams
> = ({ trades, currentPageToken }) => {
  const movingDedupIds = new Set(currentPageToken?.movingDedupIds || []);

  /**
   * startTime & endTime are inclusive, so due to pagination mechanism
   * we have to filter out a boundary-timestamp trade.
   *
   * Also there might be an edge case with same-millisecond trades.
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
    nextPageUntil: newTrades.at(-1)!.timestamp,
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
