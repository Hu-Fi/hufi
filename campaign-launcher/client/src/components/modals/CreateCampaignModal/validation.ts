import * as yup from 'yup';
import type { ObjectSchema } from 'yup';

import {
  CampaignType,
  type HoldingFormValues,
  type MarketMakingFormValues,
  type ThresholdFormValues,
} from '@/types';

const baseValidationSchema = {
  type: yup
    .mixed<CampaignType>()
    .oneOf(Object.values(CampaignType))
    .required('Required'),
  exchange: yup.string().required('Required'),
  fund_token: yup.string().required('Required'),
  fund_amount: yup
    .number()
    .typeError('Fund amount is required')
    .required('Fund amount is required')
    .test('min-amount', function (value) {
      if (!value)
        return this.createError({ message: 'Must be greater than 0' });

      const { start_date, end_date } = this.parent;
      if (!start_date || !end_date) return true;

      const startMs = new Date(start_date).getTime();
      const endMs = new Date(end_date).getTime();
      const days = Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000));
      const minValue = 10 * days;

      if (value < minValue) {
        return this.createError({
          message: `Minimum amount is ${minValue} (10 ${this.parent.fund_token.toUpperCase()} per day for ${days} days)`,
        });
      }

      return true;
    }),
  start_date: yup.date().required('Required'),
  end_date: yup
    .date()
    .required('Required')
    .test(
      'is-after-start',
      'Must be at least 6 hours after start date',
      function (value) {
        if (!value || !this.parent.start_date) return true;

        const startDate = new Date(this.parent.start_date);
        const endDate = new Date(value);
        const minEndDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);
        return endDate >= minEndDate;
      }
    ),
};

export const marketMakingValidationSchema = yup.object({
  ...baseValidationSchema,
  pair: yup
    .string()
    .matches(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/, 'Invalid pair')
    .required('Required'),
  daily_volume_target: yup
    .number()
    .typeError('Daily volume target is required')
    .min(1, 'Daily volume target must be greater than or equal to 1')
    .required('Daily volume target is required'),
}) as ObjectSchema<MarketMakingFormValues>;

export const holdingValidationSchema = yup.object({
  ...baseValidationSchema,
  symbol: yup
    .string()
    .matches(/^[\dA-Z]{3,10}$/, 'Invalid symbol')
    .required('Required'),
  daily_balance_target: yup
    .number()
    .typeError('Daily balance target is required')
    .min(1, 'Daily balance target must be greater than or equal to 1')
    .required('Daily balance target is required'),
}) as ObjectSchema<HoldingFormValues>;

export const thresholdValidationSchema = yup.object({
  ...baseValidationSchema,
  symbol: yup
    .string()
    .matches(/^[\dA-Z]{3,10}$/, 'Invalid symbol')
    .required('Required'),
  minimum_balance_target: yup
    .number()
    .typeError('Minimum balance target is required')
    .min(0.001, 'Minimum balance target must be greater than or equal to 0.001')
    .required('Minimum balance target is required'),
}) as ObjectSchema<ThresholdFormValues>;

export const campaignValidationSchema = yup.lazy((value) => {
  if (value && typeof value === 'object' && 'type' in value) {
    if (value.type === CampaignType.HOLDING) {
      return holdingValidationSchema;
    } else if (value.type === CampaignType.MARKET_MAKING) {
      return marketMakingValidationSchema;
    } else if (value.type === CampaignType.THRESHOLD) {
      return thresholdValidationSchema;
    }
  }
  return marketMakingValidationSchema;
});
