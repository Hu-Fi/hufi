import type { GetPaginationInputFn, HandlePaginationResponseFn } from './types';

type BybitNextPageToken = string;

export type BybitPaginationParams = {
  endTime: number;
  cursor?: string;
};

export const getPaginationInput: GetPaginationInputFn<
  BybitNextPageToken,
  BybitPaginationParams
> = (since, until, nextPageToken) => {
  /**
   * Bybit API is [since, until]
   */
  const params: BybitPaginationParams = {
    endTime: until - 1,
  };

  if (nextPageToken) {
    params.cursor = nextPageToken;
  }

  return {
    since,
    params,
    limit: 100, // max allowed
  };
};

export const handlePaginationResponse: HandlePaginationResponseFn<
  BybitNextPageToken,
  BybitPaginationParams
> = ({ trades, ccxtClient }) => {
  const lastResponse: { result: { nextPageCursor: string | undefined } } =
    ccxtClient.parseJson(ccxtClient.last_http_response);

  return {
    trades,
    nextPageToken: lastResponse.result.nextPageCursor,
  };
};
