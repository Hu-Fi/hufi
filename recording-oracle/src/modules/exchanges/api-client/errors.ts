import { BaseError } from '@/common/errors/base';

export class ExchangeApiClientError extends BaseError {
  constructor(
    message: string,
    readonly exchangeName: string,
  ) {
    super(message);
  }
}

export class ExchangeApiAccessError extends ExchangeApiClientError {
  constructor(
    exchangeName: string,
    readonly method: string,
    readonly cause: string,
  ) {
    super('Failed to access exchange API', exchangeName);
  }
}

export class IncompleteKeySuppliedError extends BaseError {
  constructor(readonly exchangeName: string) {
    super('Incomplete credentials supplied for exchange');
  }
}
