import { Order, Trade } from './types';

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
