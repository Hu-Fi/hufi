import type {
  GetPaginationInputFn,
  HandlePaginationResponseFn,
  PaginationParams,
} from './types';

type BitmartNextPageToken = number;

export const getPaginationInput: GetPaginationInputFn<
  BitmartNextPageToken,
  PaginationParams
> = (since, _until, nextPageToken) => {
  return {
    since: nextPageToken || since,
    params: {},
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  BitmartNextPageToken,
  PaginationParams
> = ({ trades }) => {
  return {
    trades,
    nextPageToken: trades.at(-1)!.timestamp + 1,
  };
};
