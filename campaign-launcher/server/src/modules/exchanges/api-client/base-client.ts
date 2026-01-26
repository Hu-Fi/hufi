import logger from '@/logger';
import type { Logger } from '@/logger';

import { LOAD_MARKETS_COOLDOWN } from './constants';
import { LoadMarketsError, MarketsNotLoadedError } from './errors';
import type { ExchangeApiClient } from './exchange-api-client.interface';

function AssertMarketsLoaded(
  _target: unknown,
  _propertyKey: string,
  descriptor: TypedPropertyDescriptor<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this: BaseExchangeApiClient, ...args: unknown[]) => any
  >,
) {
  const original = descriptor.value!;

  descriptor.value = function (
    this: BaseExchangeApiClient,
    ...args: unknown[]
  ) {
    if (!this.marketsLoaded) {
      throw new MarketsNotLoadedError(this.exchangeName);
    }
    return original.apply(this, args);
  };

  return descriptor;
}

export abstract class BaseExchangeApiClient implements ExchangeApiClient {
  protected logger: Logger;

  private marketsLoadedAt: number = 0;

  protected abstract tradingPairs?: string[];
  protected abstract currencies?: string[];

  constructor(readonly exchangeName: string) {
    this.logger = logger.child({
      context: this.constructor.name,
      exchangeName,
    });
  }

  get marketsLoaded(): boolean {
    return this.marketsLoadedAt > 0;
  }

  protected abstract runLoadMarkets(): Promise<void>;

  async loadMarkets(): Promise<void> {
    const msSinceLastLoad = Date.now() - this.marketsLoadedAt;

    if (this.marketsLoaded && msSinceLastLoad < LOAD_MARKETS_COOLDOWN) {
      return;
    }

    try {
      await this.runLoadMarkets();
    } catch (error) {
      this.logger.error('Failed to load markets', { error, msSinceLastLoad });
      throw new LoadMarketsError(this.exchangeName, error.message);
    }

    this.marketsLoadedAt = Date.now();
  }

  @AssertMarketsLoaded
  getTradingPairs(): string[] {
    return this.tradingPairs || [];
  }

  @AssertMarketsLoaded
  getCurrencies(): string[] {
    return this.currencies || [];
  }
}
