import { applyDecorators, Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsIn,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

import { ChainIds, type SupportedExchange } from '@/common/constants';
import { ExchangesConfigService } from '@/config';

@ValidatorConstraint({ name: 'ExchangeName', async: false })
@Injectable()
export class ExchangeNameValidator implements ValidatorConstraintInterface {
  constructor(
    private readonly exchangesConfigService: ExchangesConfigService,
  ) {}

  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return this.exchangesConfigService
      .getSupportedExchanges()
      .has(value as SupportedExchange);
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be one of the allowed values`;
  }
}

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
