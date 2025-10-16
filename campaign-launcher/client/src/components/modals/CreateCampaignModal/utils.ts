import { CampaignType } from '../../../types';

import {
  holdingValidationSchema,
  marketMakingValidationSchema,
} from './validation';

const validationSchemasMap = {
  [CampaignType.MARKET_MAKING]: marketMakingValidationSchema,
  [CampaignType.HOLDING]: holdingValidationSchema,
};

const baseFormValues = {
  exchange: '',
  start_date: new Date(),
  end_date: new Date(),
  fund_token: 'hmt',
  fund_amount: 0.1,
};

const defaultFormValuesMap = {
  [CampaignType.MARKET_MAKING]: {
    ...baseFormValues,
    type: CampaignType.MARKET_MAKING,
    pair: '',
    daily_volume_target: 1,
  },
  [CampaignType.HOLDING]: {
    ...baseFormValues,
    type: CampaignType.HOLDING,
    symbol: '',
    daily_balance_target: 1,
  },
};

export const getValidationSchema = <T extends CampaignType>(campaignType: T) =>
  validationSchemasMap[campaignType];

export const getFormDefaultValues = <T extends CampaignType>(campaignType: T) =>
  defaultFormValuesMap[campaignType];
