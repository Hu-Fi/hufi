import { BaseError } from './base';

export class InvalidEvmAddressError extends BaseError {
  constructor(readonly value: string) {
    super('Provided value is not valid EVM address');
  }
}
