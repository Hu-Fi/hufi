import * as yup from "yup";
import type { ObjectSchema } from "yup";

import { FundToken } from "../../../constants/tokens";
import type { HoldingFormValues, MarketMakingFormValues } from "../../../types";
import { CampaignType } from "../../../types";

const mapTokenToMinValue: Record<FundToken, number> = {
  usdt: 0.001,
  usdc: 0.001,
  hmt: 0.1,
};

const baseValidationSchema = {
  type: yup.mixed<CampaignType>().oneOf(Object.values(CampaignType)).required('Required'),
  exchange: yup.string().required('Required'),
  fund_token: yup.string().required('Required'),
  fund_amount: yup
    .number()
    .typeError('Fund amount is required')
    .required('Fund amount is required')
    .test('min-amount', function (value) {
      if (!value)
        return this.createError({ message: 'Must be greater than 0' });
      const fundToken: FundToken = this.parent.fund_token;
      const minValue = mapTokenToMinValue[fundToken];
      if (value < minValue) {
        return this.createError({
          message: `Minimum amount for ${fundToken.toUpperCase()} is ${minValue}`,
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
      'Must be at least one day after start date',
      function (value) {
        if (!value || !this.parent.start_date) return true;

        const startDate = new Date(this.parent.start_date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(value);
        endDate.setHours(0, 0, 0, 0);
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 1);
        return endDate >= minEndDate;
      }
    ),  
};

export const marketMakingValidationSchema = yup.object({
  ...baseValidationSchema,
  pair: yup.string().required('Required'),
  daily_volume_target: yup
    .number()
    .typeError('Daily volume target is required')
    .min(1, 'Daily volume target must be greater than or equal to 1')
    .required('Daily volume target is required'),
}) as ObjectSchema<MarketMakingFormValues>;

export const holdingValidationSchema = yup.object({
  ...baseValidationSchema,
  symbol: yup.string().required('Required'),
  daily_balance_target: yup
    .number()
    .typeError('Daily balance target is required')
    .min(1, 'Daily balance target must be greater than or equal to 1')
    .required('Daily balance target is required'),
}) as ObjectSchema<HoldingFormValues>;

export const campaignValidationSchema = yup.lazy((value) => {
  if (value && typeof value === 'object' && 'type' in value) {
    if (value.type === CampaignType.HOLDING) {
      return holdingValidationSchema;
    } else if (value.type === CampaignType.MARKET_MAKING) {
      return marketMakingValidationSchema;
    }
  }
  return marketMakingValidationSchema;
});