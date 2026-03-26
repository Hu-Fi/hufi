import type { Exchange, Trade as CcxtTrade } from 'ccxt';

export type PaginationParams = Record<string, unknown>;

export type GetPaginationInputFn<T = unknown, P = PaginationParams> = (
  since: number,
  until: number,
  nextPageToken?: T,
) => { since: number; params: P; limit?: number };

export type HandlePaginationResponseFn<
  T = unknown,
  P = PaginationParams,
> = (input: {
  trades: CcxtTrade[];
  ccxtClient: Exchange;
  paginationParams: P;
  currentPageToken?: T;
}) => {
  trades: CcxtTrade[];
  nextPageToken?: T;
};
