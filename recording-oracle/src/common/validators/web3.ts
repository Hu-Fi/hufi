import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { SUPPORTED_EXCHANGE_NAMES } from '@/common/constants';
import { CampaignManifest } from '@/modules/campaign/types';

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

@ValidatorConstraint({ name: 'CampaignDuration', async: false })
export class CampaignDurationValidator implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CampaignManifest;
    const { start_date, end_date } = obj;

    return end_date > start_date;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'end_date must be after start_date';
  }
}
