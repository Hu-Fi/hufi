import { ExchangePermission } from '@/modules/exchanges';

import { CampaignType } from './types';

export const PROGRESS_PERIOD_DAYS = 1;

export const CAMPAIGN_PERMISSIONS_MAP: Record<
  CampaignType,
  Array<ExchangePermission>
> = {
  [CampaignType.HOLDING]: [
    ExchangePermission.VIEW_ACCOUNT_BALANCE,
    ExchangePermission.VIEW_DEPOSIT_ADDRESS,
  ],
  [CampaignType.MARKET_MAKING]: [ExchangePermission.VIEW_SPOT_TRADING_HISTORY],
  [CampaignType.COMPETITIVE_MARKET_MAKING]: [
    ExchangePermission.VIEW_SPOT_TRADING_HISTORY,
  ],
  [CampaignType.THRESHOLD]: [
    ExchangePermission.VIEW_ACCOUNT_BALANCE,
    ExchangePermission.VIEW_DEPOSIT_ADDRESS,
  ],
} as const;

export enum CampaignServiceJob {
  RECORD_CAMPAIGNS_PROGRESS = 'recordCampaignsProgress',
  SYNC_CAMPAIGN_STATUSES = 'syncCampaignStatuses',
  DISCOVER_NEW_CAMPAIGNS = 'discoverNewCampaigns',
  REFRESH_INTERIM_PROGRESS_CACHE = 'refreshInterimProgressCache',
}
