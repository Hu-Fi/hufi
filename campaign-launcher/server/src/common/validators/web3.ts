import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

import {
  ChainIds,
  SUPPORTED_EXCHANGE_NAMES,
  type SupportedExchange,
} from '@/common/constants';

const validExchangeNameSet = new Set<SupportedExchange>(
  SUPPORTED_EXCHANGE_NAMES,
);
export function isValidExchangeName(input: string): input is SupportedExchange {
  return validExchangeNameSet.has(input as SupportedExchange);
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
    IsIn(ChainIds),
    Transform(({ value }) => Number(value)),
  );
}

@ValidatorConstraint({ name: 'EvmAddress', async: false })
export class EvmAddressValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return ethers.isAddress(value);
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be a valid EVM address`;
  }
}
