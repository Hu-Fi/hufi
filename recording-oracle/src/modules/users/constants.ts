import type {
  CampaignsAutojoinPreferences,
  NotificationsPreferences,
} from './types';

export const DEFAULT_USER_PREFERENCES: {
  telegramUserId: string | null;
  notifications: NotificationsPreferences;
  campaignsAutojoin: CampaignsAutojoinPreferences;
} = Object.freeze({
  telegramUserId: null,
  campaignsAutojoin: {
    enabled: false,
    campaignTypes: [],
    exchanges: [],
    tokens: [],
  },
  notifications: {
    campaignsAutojoin: false,
  },
});

export const MAX_CAMPAIGNS_AUTOJOIN_TOKENS = 10;
