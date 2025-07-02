import type { Order as CcxtOrder, Trade as CcxtTrade } from 'ccxt';

export type Order = Pick<
  CcxtOrder,
  | 'id'
  | 'status'
  | 'timestamp'
  | 'symbol'
  | 'side'
  | 'type'
  | 'amount'
  | 'filled'
  | 'cost'
>;
export type Trade = Pick<
  CcxtTrade,
  | 'id'
  | 'timestamp'
  | 'symbol'
  | 'side'
  | 'takerOrMaker'
  | 'price'
  | 'amount'
  | 'cost'
>;

export type ExchangeApiClientInitOptions = {
  apiKey: string;
  secret: string;
};

export interface ExchangeApiClient {
  readonly exchangeName: string;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(): Promise<boolean>;

  fetchOpenOrders(symbol: string, since: number): Promise<Order[]>;

  fetchMyTrades(symbol: string, since: number): Promise<Trade[]>;
}
