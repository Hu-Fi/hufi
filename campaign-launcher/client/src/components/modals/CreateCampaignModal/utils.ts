import { CampaignType } from '@/types';

import {
  holdingValidationSchema,
  marketMakingValidationSchema,
  thresholdValidationSchema,
} from './validation';

const validationSchemasMap = {
  [CampaignType.MARKET_MAKING]: marketMakingValidationSchema,
  [CampaignType.HOLDING]: holdingValidationSchema,
  [CampaignType.THRESHOLD]: thresholdValidationSchema,
};

const baseFormValues = {
  exchange: '',
  start_date: new Date(),
  end_date: new Date(),
  fund_token: 'usdt',
  fund_amount: '',
};

const defaultFormValuesMap = {
  [CampaignType.MARKET_MAKING]: {
    ...baseFormValues,
    type: CampaignType.MARKET_MAKING,
    pair: '',
    daily_volume_target: '',
  },
  [CampaignType.HOLDING]: {
    ...baseFormValues,
    type: CampaignType.HOLDING,
    symbol: '',
    daily_balance_target: '',
  },
  [CampaignType.THRESHOLD]: {
    ...baseFormValues,
    type: CampaignType.THRESHOLD,
    symbol: '',
    minimum_balance_target: '',
  },
};

export const getValidationSchema = <T extends CampaignType>(campaignType: T) =>
  validationSchemasMap[campaignType];

export const getFormDefaultValues = <T extends CampaignType>(campaignType: T) =>
  defaultFormValuesMap[campaignType];
