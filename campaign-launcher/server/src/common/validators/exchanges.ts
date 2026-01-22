import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

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

    return this.exchangesConfigService.isExchangeSupported(value);
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be one of the allowed values`;
  }
}
