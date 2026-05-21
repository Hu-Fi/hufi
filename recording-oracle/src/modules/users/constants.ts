import type {
  CampaignsAutojoinPreferences,
  NotificationsPreferences,
} from './types';

export const DEFAULT_USER_PREFERENCES: {
  notifications: NotificationsPreferences;
  campaignsAutojoin: CampaignsAutojoinPreferences;
} = Object.freeze({
  campaignsAutojoin: {
    enabled: false,
    campaignTypes: [],
    exchanges: [],
    tokens: [],
  },
  notifications: {
    telegramUserId: null,
    campaignsAutojoin: false,
  },
});

export const MAX_CAMPAIGNS_AUTOJOIN_TOKENS = 10;
