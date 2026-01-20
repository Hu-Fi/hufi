import { LOAD_MARKETS_COOLDOWN } from './constants';
import { MarketsNotLoadedError } from './errors';
import type {
  ExchangeApiClient,
  ExchangeInfo,
} from './exchange-api-client.interface';

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
  protected marketsLoadedAt: number = 0;

  protected abstract tradingPairs?: string[];
  protected abstract currencies?: string[];

  constructor(readonly exchangeName: string) {}

  abstract get info(): ExchangeInfo;

  abstract get marketsLoaded(): boolean;

  protected abstract runLoadMarkets(): Promise<void>;

  async loadMarkets(): Promise<void> {
    const msSinceLastLoad = Date.now() - this.marketsLoadedAt;

    if (this.marketsLoaded && msSinceLastLoad < LOAD_MARKETS_COOLDOWN) {
      return;
    }

    await this.runLoadMarkets();

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
