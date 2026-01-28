import { BaseError } from './base';

export class ExchangeNotSupportedError extends BaseError {
  constructor(exchangeName: string) {
    super(`Exchange not supported: ${exchangeName}`);
  }
}
