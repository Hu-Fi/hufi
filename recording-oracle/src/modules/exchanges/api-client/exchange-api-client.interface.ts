import { ExchangeName } from '@/common/constants';

import {
  AccountBalance,
  ExchangePermission,
  RequiredAccessCheckResult,
  Trade,
} from './types';

type ExchangeApiClientInitOptions = {
  userId: string;
  sandbox?: boolean;
  loggingConfig?: Partial<{
    logPermissionErrors: boolean;
  }>;
};
export type CexApiClientInitOptions = ExchangeApiClientInitOptions & {
  apiKey: string;
  secret: string;
};

export type DexApiClientInitOptions = ExchangeApiClientInitOptions & {
  userEvmAddress: string;
};

export interface ExchangeApiClient {
  readonly exchangeName: ExchangeName;

  checkRequiredCredentials(): boolean;

  checkRequiredAccess(
    permissionsToCheck: Array<ExchangePermission>,
  ): Promise<RequiredAccessCheckResult>;

  /**
   * Fetch interval is [since; until)
   */
  fetchMyTrades(
    symbol: string,
    since: number,
    until: number,
  ): AsyncGenerator<Trade[]>;

  fetchBalance(): Promise<AccountBalance>;

  fetchDepositAddress(symbol: string): Promise<string>;
}
