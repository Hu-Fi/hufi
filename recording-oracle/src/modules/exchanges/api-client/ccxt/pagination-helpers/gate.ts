import type { Trade as CcxtTrade } from 'ccxt';

import type { GetPaginationInputFn, HandlePaginationResponseFn } from './types';

type GateNextPageToken = number;

/**
 * Put it using symbol to avoid being sent as part of request
 * and also being removed by ccxt under the hood
 */
export const UNTIL_PARAM_SYMBOL = Symbol('hidden "until" param');

export type GatePaginationParams = {
  to: number;
  page: number;
  [UNTIL_PARAM_SYMBOL]: number;
};

const PAGE_LIMIT = 250; // max is 1000
/**
 * There is a hard limit on max number of records that can
 * be fetched using Gate pagination mechanism.
 */
const MAX_OFFSET = 100_000;
const N_MAX_PAGES = Math.floor(MAX_OFFSET / PAGE_LIMIT) + 1;

/**
 * https://www.gate.com/docs/developers/apiv4/en/#query-personal-trading-records
 * API has a hard limit on a number of records/pages
 */

export const getPaginationInput: GetPaginationInputFn<
  GateNextPageToken,
  GatePaginationParams
> = (since, until, nextPageToken) => {
  const params: GatePaginationParams = {
    /**
     * Gate API is [since, until) and has values in seconds.
     * ccxt under the hood converts it via "parseFloat(parseInt(v))",
     * so in order to get items up to "until" we need to convert it on our end
     * and later filter out using "until" in ms
     */
    to: Math.ceil(until / 1000),
    page: nextPageToken || 1,
    [UNTIL_PARAM_SYMBOL]: until,
  };

  return {
    since,
    params,
    limit: PAGE_LIMIT,
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  GateNextPageToken,
  GatePaginationParams
> = ({ trades, paginationParams }) => {
  let nextPageToken: number | undefined;

  /**
   * API range in seconds, but it returns ms timestamps as well and ccxt
   * under the hood uses ms value when parsing and filters out by "since",
   * so filter out by "until" on our end.
   */
  const filteredTrades: CcxtTrade[] = [];
  for (const trade of trades) {
    if (paginationParams[UNTIL_PARAM_SYMBOL] > trade.timestamp) {
      filteredTrades.push(trade);
    }
  }

  if (filteredTrades.length === 0) {
    return { trades: [] };
  }

  const lastPage = paginationParams.page;
  if (lastPage < N_MAX_PAGES) {
    nextPageToken = lastPage + 1;
  }

  return {
    trades: filteredTrades,
    nextPageToken,
  };
};
