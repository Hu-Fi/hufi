import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

type TradesPagiantionRecord = {
  id: string;
  tradeId: string;
};

type HtxNextPageToken = {
  oldestPaginationRecord: TradesPagiantionRecord;
};

type HtxPaginationParams = {
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
   * Make boundaries inclusuve, becuase HTX doesn't
   */
  const _since = since - 1;
  const _until = until + 1;

  const params: HtxPaginationParams = {
    until: _until,
    size: 250, // max allowed is 500;
    direct: 'next',
  };

  if (nextPageToken?.oldestPaginationRecord) {
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
    (trade) => (trade.info as TradesPagiantionRecord).id !== currentPageFromId,
  );
  if (newTrades.length === 0) {
    return { trades: [] };
  }

  return {
    trades: newTrades,
    nextPageToken: {
      oldestPaginationRecord: trades.at(-1)!.info as TradesPagiantionRecord,
    },
  };
};
