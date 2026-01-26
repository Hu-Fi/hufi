import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

import { ChainIds } from '@/common/constants';

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
