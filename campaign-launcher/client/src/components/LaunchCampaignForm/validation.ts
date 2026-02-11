import * as yup from 'yup';
import type { ObjectSchema } from 'yup';

import {
  AllowanceType,
  CampaignType,
  type CampaignFormValues,
  type HoldingFormValues,
  type MarketMakingFormValues,
  type ThresholdFormValues,
} from '@/types';

const MAX_DURATION = 100 * 24 * 60 * 60 * 1000; // 100 days
const MIN_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const validateCampaignDuration = (startDate: Date, endDate: Date) => {
  const duration = endDate.getTime() - startDate.getTime();
  return duration <= MAX_DURATION && duration >= MIN_DURATION;
};

export const createFundAmountValidationSchema = (
  startDate: Date,
  endDate: Date,
  fundToken: string
) => {
  return yup.object({
    selected_allowance: yup
      .string()
      .default(AllowanceType.UNLIMITED)
      .oneOf(Object.values(AllowanceType)),
    custom_allowance_amount: yup
      .string()
      .default('')
      .trim()
      .test('is-number', 'Allowance must be a valid number', (value) => {
        if (!value) return true;
        const num = Number(value);
        return !isNaN(num);
      })
      .test('is-positive', 'Allowance must be greater than 0', (value) => {
        if (!value) return true;
        const num = Number(value);
        return num > 0;
      })
      .test(
        'min-fund-amount',
        'Allowance must be greater than or equal to fund amount',
        function (value) {
          if (!value) return true;
          const customAllowance = Number(value);
          const fundAmount = Number(this.parent.fund_amount);
          if (!fundAmount || isNaN(customAllowance) || isNaN(fundAmount)) {
            return true;
          }
          return customAllowance >= fundAmount;
        }
      ),
    fund_amount: yup
      .string()
      .required('Fund amount is required')
      .test('is-number', 'Fund amount must be a valid number', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num);
      })
      .test('is-positive', 'Fund amount must be greater than 0', (value) => {
        if (!value) return false;
        const num = Number(value);
        return num > 0;
      })
      .test('min-amount', function (value) {
        if (!value) return true;

        const numValue = Number(value);
        if (numValue <= 0) return true;

        if (!startDate || !endDate) return true;

        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        const days = Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000));
        const minValue = 10 * days;

        // keeping HMT not validated for testing purposes
        if (numValue < minValue && fundToken !== 'hmt') {
          return this.createError({
            message: `Minimum amount is ${minValue} \n(10 ${fundToken.toUpperCase()} per day for ${days} day(s))`,
          });
        }

        return true;
      }),
  });
};

const baseValidationSchema = {
  type: yup
    .mixed<CampaignType>()
    .oneOf(Object.values(CampaignType))
    .required('Required'),
  exchange: yup.string().required('Required'),
  fund_token: yup.string().required('Required'),
  start_date: yup
    .date()
    .required('Required')
    .test('is-future', 'Start date cannot be in the past', function (value) {
      if (!value) return true;
      return value.getTime() > Date.now();
    })
    .test(
      'duration',
      'Campaign duration must be between 6 hours and 100 days',
      function (value) {
        if (!value || !this.parent.end_date) return true;
        return validateCampaignDuration(value, this.parent.end_date);
      }
    ),
  end_date: yup
    .date()
    .required('Required')
    .test('is-future', 'End date cannot be in the past', function (value) {
      if (!value) return true;
      return value.getTime() > Date.now();
    })
    .test(
      'duration',
      'Campaign duration must be between 6 hours and 100 days',
      function (value) {
        if (!value || !this.parent.start_date) return true;
        return validateCampaignDuration(this.parent.start_date, value);
      }
    ),
};

export const marketMakingValidationSchema = yup.object({
  ...baseValidationSchema,
  pair: yup
    .string()
    .required('Required')
    .matches(/^[\dA-Z]{3,10}\/[\dA-Z]{3,10}$/, 'Invalid pair'),
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
    .required('Required')
    .matches(/^[\dA-Z]{3,10}$/, 'Invalid symbol'),
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
    .required('Required')
    .matches(/^[\dA-Z]{3,10}$/, 'Invalid symbol'),
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
}) as unknown as ObjectSchema<CampaignFormValues>;
