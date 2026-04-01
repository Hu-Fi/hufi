import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

export type TradesPaginationRecord = {
  id: string;
  tradeId: string;
};

export type HtxNextPageToken = {
  oldestPaginationRecord: TradesPaginationRecord;
};

export type HtxPaginationParams = {
  until: number;
  size: number;
  direct: 'next' | 'prev';
  from?: string;
};

export const getPaginationInput: GetPaginationInputFn<
  HtxNextPageToken,
  PaginationParams
> = (since, until, nextPageToken) => {
  /**
   * HTX boundaries are exclusive, i.e. (since, until)
   */
  const _since = since - 1;

  const params: HtxPaginationParams = {
    until,
    size: 250, // max allowed is 500;
    direct: 'next',
  };

  if (nextPageToken) {
    params.from = nextPageToken.oldestPaginationRecord.id;
  }

  return {
    since: _since,
    params,
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  HtxNextPageToken,
  PaginationParams
> = ({ trades, currentPageToken }) => {
  const currentPageFromId = currentPageToken?.oldestPaginationRecord?.id;
  /**
   * "from" record is always included in response, so we need to
   * filter it out to avoid duplicates between pages.
   * If it's the only item returned, then it means that
   * we have reached the end of pagination
   */
  const newTrades = trades.filter(
    (trade) => (trade.info as TradesPaginationRecord).id !== currentPageFromId,
  );
  if (newTrades.length === 0) {
    return { trades: [] };
  }

  return {
    trades: newTrades,
    nextPageToken: {
      oldestPaginationRecord: newTrades.at(-1)!.info as TradesPaginationRecord,
    },
  };
};
