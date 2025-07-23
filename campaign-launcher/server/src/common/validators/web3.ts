import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ChainIds, SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';

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

/**
 * TODO: Remove "ALL" value from ChainId enum in sdk
 * to avoid selecting it as valid value in flows
 */
export function IsChainId() {
  return applyDecorators(
    IsEnum(ChainIds),
    Transform(({ value }) => Number(value)),
  );
}
