import type { CampaignsAutojoinPreferences } from './types';

export const DEFAULT_USER_PREFERENCES: {
  campaignsAutojoin: CampaignsAutojoinPreferences;
} = {
  campaignsAutojoin: {
    enabled: false,
    exchanges: [],
    campaignTypes: [],
    tokens: [],
  },
};

export const MAX_CAMPAIGNS_AUTOJOIN_TOKENS = 10;
