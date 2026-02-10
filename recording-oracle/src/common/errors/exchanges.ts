import { BaseError } from './base';

export class ExchangeNotSupportedError extends BaseError {
  constructor(readonly exchangeName: string) {
    super(`Exchange not supported: ${exchangeName}`);
  }
}
