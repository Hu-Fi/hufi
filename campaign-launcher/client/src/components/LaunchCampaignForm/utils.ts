import { CampaignType } from '@/types';

const baseFormValues = {
  exchange: '',
  start_date: new Date(),
  end_date: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours after start date
  fund_token: 'usdt',
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
  [CampaignType.COMPETITIVE_MARKET_MAKING]: {
    ...baseFormValues,
    type: CampaignType.COMPETITIVE_MARKET_MAKING,
    pair: '',
    minimum_volume_required: '',
    rewards_distribution: [],
  },
  [CampaignType.THRESHOLD_MARKET_MAKING]: {
    ...baseFormValues,
    type: CampaignType.THRESHOLD_MARKET_MAKING,
    pair: '',
    minimum_volume_target: '',
    max_participants: '',
  },
};

export const LAUNCH_SUPPORTED_CAMPAIGN_TYPES = [
  CampaignType.MARKET_MAKING,
  CampaignType.HOLDING,
  CampaignType.THRESHOLD,
  CampaignType.THRESHOLD_MARKET_MAKING,
  CampaignType.COMPETITIVE_MARKET_MAKING,
] as const;
export type LaunchSupportedCampaignType =
  (typeof LAUNCH_SUPPORTED_CAMPAIGN_TYPES)[number];

export const getFormDefaultValues = <T extends LaunchSupportedCampaignType>(
  campaignType: T
) => defaultFormValuesMap[campaignType];

/*
This function removes leading zeros, eliminates negative sign and limits the number of digits after decimal point to 3
*/
export const formatInputValue = (value: string) => {
  return value
    .replace(/-/g, '')
    .replace(/^0+(?=\d)/, '')
    .replace(/(\.\d{3})\d+$/, '$1');
};
