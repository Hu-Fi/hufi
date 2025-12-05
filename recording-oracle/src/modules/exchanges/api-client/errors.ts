import { BaseError } from '@/common/errors/base';

export class ExchangeApiClientError extends BaseError {}

export class ExchangeApiAccessError extends ExchangeApiClientError {}

export class IncompleteKeySuppliedError extends BaseError {
  constructor(readonly exchangeName: string) {
    super('Incomplete credentials supplied for exchange');
  }
}
