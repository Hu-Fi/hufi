import type { GetPaginationInputFn, HandlePaginationResponseFn } from './types';

type GateNextPageToken = number;

export type GatePaginationParams = {
  until: number;
  page: number;
};

export const getPaginationInput: GetPaginationInputFn<
  GateNextPageToken,
  GatePaginationParams
> = (since, until, nextPageToken) => {
  const params: GatePaginationParams = {
    /**
     * Origin API has it as 'to', but it's in seconds,
     * so pass it as 'until' for ccxt to convert it.
     */
    until,
    page: nextPageToken || 1,
  };

  return {
    since,
    params,
    limit: 250, // max is 1000
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  GateNextPageToken,
  GatePaginationParams
> = ({ trades, paginationParams }) => {
  let nextPageToken: number | undefined;

  const lastPage = paginationParams.page;
  // there is a hard limit on number of pages
  if (lastPage < 100) {
    nextPageToken = lastPage + 1;
  }

  return { trades, nextPageToken };
};
