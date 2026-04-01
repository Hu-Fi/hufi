import _ from 'lodash';

import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

type TestNextPageToken = {
  nextPageSince: number;
};

export const getPaginationInput: GetPaginationInputFn<
  TestNextPageToken,
  PaginationParams
> = (since, _until, nextPageToken) => {
  return {
    since: nextPageToken?.nextPageSince || since,
    params: {},
    limit: 42,
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  TestNextPageToken,
  PaginationParams
> = ({ trades }) => {
  // mimic ccxt pagination example for unit tests
  const _trades = _.orderBy(trades, 'timestamp', 'asc');

  return {
    trades: _trades,
    nextPageToken: {
      nextPageSince: _trades.at(-1)!.timestamp + 1,
    },
  };
};
