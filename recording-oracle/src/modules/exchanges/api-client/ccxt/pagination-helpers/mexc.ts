import type { Trade as CcxtTrade } from 'ccxt';
import _ from 'lodash';

import type { GetPaginationInputFn, HandlePaginationResponseFn } from './types';

type MexcNextPageToken = {
  nextPageUntil: number;
  movingDedupIds: string[];
};

type MexcPaginationParams = {
  until: number;
};

const PAGE_LIMIT = 100; // max allowed

export const getPaginationInput: GetPaginationInputFn<
  MexcNextPageToken,
  MexcPaginationParams
> = (since, until, nextPageToken) => {
  const params: MexcPaginationParams = {
    until: nextPageToken?.nextPageUntil || until,
  };

  return {
    since,
    params,
    limit: PAGE_LIMIT,
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  MexcNextPageToken,
  MexcPaginationParams
> = ({ trades, currentPageToken }) => {
  const movingDedupIds = new Set(currentPageToken?.movingDedupIds || []);

  /**
   * There might be same-second trades that are cut by limit param,
   * so in order to retrieve all trades we need to query next page
   * using same timestamp as a boundary object and filter entries
   * with same timestamp from previous pages.
   *
   * We have to keep all trades ids to avoid infinite fetches when
   * the whole page consists of same-seconds trades.
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

  const nextPageToken: MexcNextPageToken = {
    nextPageUntil: newTrades.at(-1)!.timestamp,
    /**
     * Keep ids from up to two last full pages in order to dedup,
     * because we only need two pages to detect if we stuck in situation
     * where there are more trades within same-second than trades page limit.
     */
    movingDedupIds: [...movingDedupIds, ..._.map(newTrades, 'id')].slice(
      -1 * PAGE_LIMIT * 2,
    ),
  };

  return { trades: newTrades, nextPageToken };
};
