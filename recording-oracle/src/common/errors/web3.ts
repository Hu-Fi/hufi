import { BaseError } from './base';

export class NotValidEvmAddressError extends BaseError {
  constructor(readonly value: string) {
    super('Provided value is not valid EVM address');
  }
}
