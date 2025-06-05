import ccxt from 'ccxt';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const validExchangeNameSet = new Set(ccxt.exchanges);
export function isValidExchangeName(input: string): boolean {
  return validExchangeNameSet.has(input);
}

@ValidatorConstraint({ name: 'ExchangeName', async: false })
export class ExchangeNameValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return isValidExchangeName(value);
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be one of the allowed values`;
  }
}
