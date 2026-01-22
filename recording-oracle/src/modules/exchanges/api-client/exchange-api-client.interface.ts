import { ExchangeName } from '@/common/constants';

import {
  AccountBalance,
  ExchangePermission,
  ExtraCreds,
  Order,
  RequiredAccessCheckResult,
  Trade,
} from './types';

export type ExchangeApiClientLoggingConfig = {
  logPermissionErrors: boolean;
};

export type ExchangeApiClientInitOptions = {
  userId: string;
  apiKey: string;
  secret: string;
  extraCreds?: ExtraCreds;
  loggingConfig?: Partial<ExchangeApiClientLoggingConfig>;
};

export interface ExchangeApiClient {
  readonly exchangeName: ExchangeName;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult>;

  fetchOpenOrders(symbol: string, since: number): Promise<Order[]>;

  fetchMyTrades(symbol: string, since: number): Promise<Trade[]>;

  fetchBalance(): Promise<AccountBalance>;

  fetchDepositAddress(symbol: string): Promise<string>;
}
