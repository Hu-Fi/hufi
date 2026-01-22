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

  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    if (!this.exchangesConfigService.isExchangeSupported(value)) {
      return false;
    }

    /**
     * 'constraints' can be undefined if used as @Validate(CustomValidator),
     * i.e. w/o passing default constraints
     */
    const [typeConstraint] = args.constraints || [];
    const exchangeConfig = this.exchangesConfigService.configByExchange[value];
    if (typeConstraint && typeConstraint !== exchangeConfig.type) {
      return false;
    }

    return true;
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be one of the allowed values`;
  }
}
