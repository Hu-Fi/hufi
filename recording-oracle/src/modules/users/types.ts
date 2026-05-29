export type CampaignsAutojoinPreferences = {
  enabled: boolean;
  exchanges: string[];
  campaignTypes: string[];
  tokens: string[];
};

export type NotificationsPreferences = {
  campaignsAutojoin: boolean;
};
