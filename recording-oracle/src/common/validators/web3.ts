import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';

const validExchangeNameSet = new Set(SUPPORTED_EXCHANGE_NAMES);
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

export function isValidNonce(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[0-9a-fA-F]{32}$/.test(value);
}
