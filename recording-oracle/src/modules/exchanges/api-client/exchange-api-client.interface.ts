import { ExchangeName } from '@/common/constants';

import {
  AccountBalance,
  ExchangePermission,
  ExtraCreds,
  RequiredAccessCheckResult,
  Trade,
} from './types';

export type CexApiClientInitOptions = {
  userId: string;
  apiKey: string;
  secret: string;
  extraCreds?: ExtraCreds;
  loggingConfig?: Partial<{
    logPermissionErrors: boolean;
  }>;
};

export type DexApiClientInitOptions = {
  userId: string;
  userEvmAddress: string;
};

export interface ExchangeApiClient {
  readonly exchangeName: ExchangeName;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult>;

  fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]>;

  fetchBalance(): Promise<AccountBalance>;

  fetchDepositAddress(symbol: string): Promise<string>;
}
