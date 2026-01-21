import { BaseError } from '@/common/errors/base';

export class ExchangeApiClientError extends BaseError {
  constructor(
    message: string,
    readonly exchangeName: string,
  ) {
    super(message);
  }
}

export class MarketsNotLoadedError extends ExchangeApiClientError {
  constructor(exchangeName: string) {
    super('Markets not loaded for exchange', exchangeName);
  }
}

export class LoadMarketsError extends ExchangeApiClientError {
  constructor(
    exchangeName: string,
    readonly reason: unknown,
  ) {
    super('Failed to load markets', exchangeName);
  }
}
