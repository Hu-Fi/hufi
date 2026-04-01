import type { Trade as CcxtTrade } from 'ccxt';
import _ from 'lodash';

import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

export type XtNextPageToken = {
  oldestTradeAt: number;
  movingDedupIds: string[];
};

const PAGE_LIMIT = 100; // max allowed

export const getPaginationInput: GetPaginationInputFn<
  XtNextPageToken,
  PaginationParams
> = (since, until, nextPageToken) => {
  /**
   * Xt API is [since, until]
   */
  let endTime: number;

  if (nextPageToken) {
    /**
     * Keep it as is to handle same-millisecond trades
     */
    endTime = nextPageToken.oldestTradeAt;
  } else {
    endTime = until - 1;
  }

  return {
    limit: PAGE_LIMIT,
    since,
    params: {
      direction: 'NEXT', // from newest to oldest
      endTime,
    },
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  XtNextPageToken,
  PaginationParams
> = ({ trades, ccxtClient, currentPageToken }) => {
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

  const lastResponse = ccxtClient.parseJson(ccxtClient.last_http_response);

  let nextPageToken: XtNextPageToken | undefined;

  if (lastResponse.result.hasNext) {
    nextPageToken = {
      oldestTradeAt: newTrades.at(-1)!.timestamp,
      /**
       * Keep last two pages to detect if we stuck in situation
       * where there are more trades within same-millisecond than trades page limit.
       */
      movingDedupIds: [...movingDedupIds, ..._.map(newTrades, 'id')].slice(
        -1 * PAGE_LIMIT * 2,
      ),
    };
  }

  return {
    trades: newTrades,
    nextPageToken,
  };
};
