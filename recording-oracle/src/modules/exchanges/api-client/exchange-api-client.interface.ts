import {
  AccountBalance,
  ExchangePermission,
  Order,
  RequiredAccessCheckResult,
  Trade,
} from './types';

export type ExchangeApiClientInitOptions = {
  apiKey: string;
  secret: string;
};

export interface ExchangeApiClient {
  readonly exchangeName: string;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult>;

  fetchOpenOrders(symbol: string, since: number): Promise<Order[]>;

  fetchMyTrades(symbol: string, since: number): Promise<Trade[]>;

  fetchBalance(): Promise<AccountBalance>;

  fetchDepositAddress(symbol: string): Promise<string>;
}
