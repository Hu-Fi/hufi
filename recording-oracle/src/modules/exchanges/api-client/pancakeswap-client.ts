import { ExchangeName } from '@/common/constants';
import { MethodNotImplementedError } from '@/common/errors/base';
import logger from '@/logger';
import type { Logger } from '@/logger';

import {
  type DexApiClientInitOptions,
  ExchangeApiClient,
} from './exchange-api-client.interface';
import type { RequiredAccessCheckResult, Trade } from './types';

export class PancakeswapClient implements ExchangeApiClient {
  readonly exchangeName = ExchangeName.PANCAKESWAP;
  readonly userId: string;
  readonly userEvmAddress: string;

  protected logger: Logger;

  constructor({ userId, userEvmAddress }: DexApiClientInitOptions) {
    this.userId = userId;
    this.userEvmAddress = userEvmAddress;

    this.logger = logger.child({
      context: PancakeswapClient.name,
      exchangeName: this.exchangeName,
      userId,
    });
  }

  checkRequiredCredentials(): boolean {
    return true;
  }

  checkRequiredAccess(): Promise<RequiredAccessCheckResult> {
    return Promise.resolve({ success: true });
  }

  async fetchMyTrades(symbol: string, since: number): Promise<Trade[]> {
    this.logger.warn('fetchMyTrades call for user', {
      evmAddress: this.userEvmAddress,
      symbol,
      since,
    });

    return [];
  }

  fetchOpenOrders(): never {
    throw new MethodNotImplementedError();
  }

  fetchBalance(): never {
    throw new MethodNotImplementedError();
  }

  fetchDepositAddress(): never {
    throw new MethodNotImplementedError();
  }
}
