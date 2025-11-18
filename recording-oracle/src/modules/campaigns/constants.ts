import { ExchangePermission } from '@/modules/exchanges';

import { CampaignType } from './types';

export const PROGRESS_PERIOD_DAYS = 1;

export const CAMPAIGN_PERMISSIONS_MAP: Record<
  CampaignType,
  Array<ExchangePermission>
> = {
  [CampaignType.HOLDING]: [
    ExchangePermission.FETCH_BALANCE,
    ExchangePermission.FETCH_DEPOSIT_ADDRESS,
  ],
  [CampaignType.MARKET_MAKING]: [ExchangePermission.FETCH_MY_TRADES],
  [CampaignType.THRESHOLD]: [
    ExchangePermission.FETCH_BALANCE,
    ExchangePermission.FETCH_DEPOSIT_ADDRESS,
  ],
} as const;
