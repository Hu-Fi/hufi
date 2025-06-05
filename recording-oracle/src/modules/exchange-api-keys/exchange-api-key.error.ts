import { BaseError } from '@/common/errors/base';

export class ExchangeApiKeyNotFoundError extends BaseError {
  constructor(
    readonly userId: string,
    readonly exchangeName: string,
  ) {
    super('Exchange API key not found');
  }
}
